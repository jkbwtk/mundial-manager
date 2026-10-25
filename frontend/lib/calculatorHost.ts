import { useAction } from '@solidjs/router';
import { type Connection, connect, WindowMessenger } from 'penpal';
import { onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { getSortedLineup } from '#flib/activeMatches';
import { onLeagueEvent } from '#flib/leagueEvents';
import {
  actionCreateMatchWithWebhook,
  actionDeleteMatch,
  actionSaveMatchTimeline,
  actionUpdateMatchWithWebhook,
  queryActiveLeague,
  queryBalls,
  queryCurrentSeason,
  queryGoalTypes,
  queryMatches,
  queryMatchPrediction,
  queryMatchPreview,
  queryMatchTimeline,
  queryPlayers,
  queryTables,
} from '#flib/trpcCalls';
import { isGoalTypeEnabled } from '#shared/goalTypes';
import { getLiveMatchPrediction } from '#shared/stats/matchPrediction';
import { MatchQueryMeta } from '#shared/types/api/match';
import {
  type MatchPrediction,
  MatchPredictionQuery,
} from '#shared/types/api/stats';
import {
  type CalculatorApi,
  CalculatorFinishEvent,
  LiveMatchPredictionInput,
} from '#shared/types/MundialCalculator';

export interface CalculatorHostOptions {
  iframe: () => HTMLIFrameElement;

  onFinishEvent: (event: CalculatorFinishEvent) => void;
  onConnect?: () => void;
  onConnectError?: (err: unknown) => void;
}

function isPenpalHandshake(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'namespace' in data &&
    data.namespace === 'penpal' &&
    'type' in data &&
    data.type === 'SYN'
  );
}

export function useCalculatorHost(options: CalculatorHostOptions): void {
  const createMatch = useAction(actionCreateMatchWithWebhook);
  const updateMatch = useAction(actionUpdateMatchWithWebhook);
  const deleteMatch = useAction(actionDeleteMatch);
  const saveMatchTimeline = useAction(actionSaveMatchTimeline);

  const predictions = new Map<string, Promise<MatchPrediction | null>>();

  let messenger: WindowMessenger | undefined;
  let connection: Connection | undefined;
  let isConnected = false;
  let isDisposed = false;

  const getOrigin = () => new URL(options.iframe().src).origin;

  const receiveFinishEvent = (data: unknown) => {
    const parsed = CalculatorFinishEvent.safeParse(data);

    if (!parsed.success) {
      throw new Error('Invalid calculator finish event');
    }

    options.onFinishEvent(parsed.data);
  };

  const getLineupPrediction = (input: LiveMatchPredictionInput) => {
    const lineup = getSortedLineup(input);
    const key = JSON.stringify(lineup);

    return predictions.getOrInsertComputed(key, () =>
      queryMatchPrediction(lineup).catch((err) => {
        predictions.delete(key);

        throw err;
      }),
    );
  };

  const getMatchPrediction = async (data: unknown) => {
    const input = LiveMatchPredictionInput.parse(data);
    const prediction = await getLineupPrediction(input);

    return prediction && getLiveMatchPrediction(prediction, input);
  };

  const methods = {
    getTables: () => queryTables().then((r) => r.data),
    getBalls: () => queryBalls().then((r) => r.data),
    getPlayers: () => queryPlayers().then((r) => r.data),
    getGoalTypes: async () => {
      const [goalTypes, season] = await Promise.all([
        queryGoalTypes(),
        queryCurrentSeason(),
      ]);

      return goalTypes.data.filter((goalType) =>
        isGoalTypeEnabled(season?.config ?? null, goalType.uuid),
      );
    },

    getActiveLeague: () => queryActiveLeague(),
    getCurrentSeason: () => queryCurrentSeason(),

    getMatchPrediction,

    getMatches: (meta) => queryMatches(MatchQueryMeta.parse(meta)),
    getMatchTimeline: (matchUuid) => queryMatchTimeline(matchUuid),
    getMatchPreview: (lineup) =>
      queryMatchPreview(getSortedLineup(MatchPredictionQuery.parse(lineup))),

    createLegacyMatch: receiveFinishEvent,

    createMatch,
    updateMatch,
    deleteMatch,

    saveMatchTimeline,
  } satisfies CalculatorApi;

  const connectHost = async () => {
    connection?.destroy();
    messenger?.destroy();
    isConnected = false;

    messenger = new WindowMessenger({
      remoteWindow: options.iframe().contentWindow!,
      allowedOrigins: [getOrigin()],
    });

    const current = connect({
      messenger,
      log: (...args) => console.debug(...args),
      methods,
    });

    connection = current;

    try {
      await current.promise;

      isConnected = true;
      options.onConnect?.();
    } catch (err) {
      if (isDisposed || connection !== current) return;

      options.onConnectError?.(err);
    }
  };

  const handleMessage = (ev: MessageEvent) => {
    if (
      ev.source !== options.iframe().contentWindow ||
      ev.origin !== getOrigin()
    ) {
      return;
    }

    // A handshake after connecting means the calculator reloaded
    if (isConnected && isPenpalHandshake(ev.data)) {
      connectHost();

      return;
    }

    const parsed = CalculatorFinishEvent.safeParse(ev.data);

    if (parsed.success) options.onFinishEvent(parsed.data);
  };

  onLeagueEvent('STATS', () => predictions.clear());

  const handleLoad = () => {
    if (!isConnected) connectHost();
  };

  onMount(() => {
    window.addEventListener('message', handleMessage);
    options.iframe().addEventListener('load', handleLoad);

    connectHost();
  });

  onCleanup(() => {
    isDisposed = true;

    if (isServer) return;

    window.removeEventListener('message', handleMessage);
    options.iframe().removeEventListener('load', handleLoad);
    connection?.destroy();
    messenger?.destroy();
  });
}
