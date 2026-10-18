import { useAction } from '@solidjs/router';
import { type Connection, connect, WindowMessenger } from 'penpal';
import { getOwner, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { onLeagueEvent } from '#flib/leagueEvents';
import { convertCalculatorFinishEventToMatch } from '#flib/legacyMatches';
import {
  actionCreateMatchWithWebhook,
  actionDeleteMatch,
  actionSaveMatchTimeline,
  actionUpdateMatchWithWebhook,
  queryActiveLeague,
  queryBalls,
  queryCurrentSeason,
  queryGoalTypes,
  queryMatchPrediction,
  queryPlayers,
  queryTables,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { isGoalTypeEnabled } from '#shared/goalTypes';
import { getLiveMatchPrediction } from '#shared/stats/matchPrediction';
import type { MatchPrediction } from '#shared/types/api/stats';
import {
  type CalculatorApi,
  CalculatorFinishEvent,
  LiveMatchPredictionInput,
} from '#shared/types/MundialCalculator';
import style from './MundialCalculator.module.scss';

const CALCULATOR_URL = import.meta.env.VITE_CALCULATOR_URL;

const MundialCalculator: Component = () => {
  const [, { open }] = useModal();
  const [, actions] = useToast();
  const owner = getOwner();

  let iframeRef!: HTMLIFrameElement;

  let isDisposed = false;

  const getCalculatorOrigin = () => new URL(iframeRef.src).origin;

  const openMatchModal = (data: CalculatorFinishEvent) => {
    open({
      props: {
        component: MatchSaveConfirmModal,
        match: convertCalculatorFinishEventToMatch(data),
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const receiveFinishEvent = (data: unknown) => {
    const parsed = CalculatorFinishEvent.safeParse(data);

    if (!parsed.success) {
      throw new Error('Invalid calculator finish event');
    }

    openMatchModal(parsed.data);
  };

  const predictions = new Map<string, Promise<MatchPrediction | null>>();

  onLeagueEvent('STATS', () => predictions.clear());

  const getLineupPrediction = (input: LiveMatchPredictionInput) => {
    const lineup = {
      playersSide1: input.playersSide1.toSorted(),
      playersSide2: input.playersSide2.toSorted(),
    };
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

  const createMatch = useAction(actionCreateMatchWithWebhook);
  const updateMatch = useAction(actionUpdateMatchWithWebhook);
  const deleteMatch = useAction(actionDeleteMatch);

  const saveMatchTimeline = useAction(actionSaveMatchTimeline);

  const handleMessage = (ev: MessageEvent) => {
    if (
      ev.source !== iframeRef.contentWindow ||
      ev.origin !== getCalculatorOrigin()
    ) {
      return;
    }

    const parsed = CalculatorFinishEvent.safeParse(ev.data);

    if (parsed.success) openMatchModal(parsed.data);
  };

  let messenger: WindowMessenger | undefined;
  let connection: Connection | undefined;

  onMount(async () => {
    window.addEventListener('message', handleMessage);

    messenger = new WindowMessenger({
      remoteWindow: iframeRef.contentWindow!,
      allowedOrigins: [getCalculatorOrigin()],
    });

    connection = connect({
      messenger,
      log: (...args) => console.debug(...args),

      methods: {
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

        createLegacyMatch: receiveFinishEvent,

        createMatch,
        updateMatch,
        deleteMatch,

        saveMatchTimeline,
      } satisfies CalculatorApi,
    });

    try {
      await connection.promise;

      actions.info('Connection with calculator successful', {
        duration: 1000,
      });
    } catch (err) {
      if (isDisposed) return;

      console.error('Calculator connection error:', err);
      actions.error('Failed to connect to the calculator');
    }
  });

  onCleanup(() => {
    isDisposed = true;

    if (isServer === false) {
      window.removeEventListener('message', handleMessage);
      connection?.destroy();
      messenger?.destroy();
    }
  });

  return (
    <iframe
      ref={iframeRef}
      src={CALCULATOR_URL}
      title="Mundial Calculator"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export default MundialCalculator;
