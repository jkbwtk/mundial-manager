import type { RemoteProxy } from 'penpal';
import { getMatchLiveElapsed } from '#shared/matchTimeline';
import type { Match, MatchStatus } from '#shared/types/api/match';
import type { MatchEvent, MatchSide } from '#shared/types/api/matchEvent';
import type { CalculatorApi } from '#shared/types/MundialCalculator';

export type CalculatorRemote = RemoteProxy<CalculatorApi>;

export interface SimulatedMatchSetup {
  tableUuid: string | null;
  ballUuid: string | null;

  playersSide1: string[];
  playersSide2: string[];
}

export interface SimulatedGoalOptions {
  player?: string;
  ownGoal?: boolean;
  goalType?: string[];
}

export interface SimulatedMatch {
  match: () => Match | null;
  events: () => MatchEvent[];

  schedule: (startDate: Date | null) => Promise<Match>;
  start: (startDate?: Date) => Promise<Match>;
  attach: (match: Match, events: MatchEvent[]) => void;

  goal: (side: MatchSide, options?: SimulatedGoalOptions) => Promise<Match>;
  ballOut: () => Promise<Match>;
  positionChange: (side: MatchSide) => Promise<Match>;
  pause: (details?: string) => Promise<Match>;
  resume: () => Promise<Match>;
  surrender: (side: MatchSide) => Promise<Match>;
  cancel: (details?: string) => Promise<Match>;
  finish: () => Promise<Match>;
  remove: () => Promise<void>;
}

export interface SimulatedMatchOptions {
  now?: () => number; // milliseconds since epoch
  onChange?: (match: Match | null, events: MatchEvent[]) => void;
}

function pickRandom<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

export function createSimulatedMatch(
  api: CalculatorRemote,
  setup: SimulatedMatchSetup,
  options: SimulatedMatchOptions = {},
): SimulatedMatch {
  const now = options.now ?? (() => Date.now());

  let current: Match | null = null;
  let events: MatchEvent[] = [];

  const notify = () => options.onChange?.(current, events);

  const getCurrentOrThrow = (): Match => {
    if (current === null) throw new Error('Simulated match is not started');

    return current;
  };

  const getOffset = () => {
    const startDate = getCurrentOrThrow().startDate;

    return startDate === null ? 0 : now() - startDate.getTime();
  };

  const getBase = () => ({
    uuid: crypto.randomUUID(),
    offset: getOffset(),
    labels: {},
  });

  const createMatch = async (status: MatchStatus, startDate: Date | null) => {
    current = await api.createMatch({
      tableUuid: setup.tableUuid,
      ballUuid: setup.ballUuid,

      startDate,
      duration: null,
      pauseDuration: 0,

      side1Score: 0,
      side2Score: 0,

      status,
      hidden: false,
      stakesModifier: 1,

      playersSide1: setup.playersSide1,
      playersSide2: setup.playersSide2,
      spectators: [],

      syncId: `simulator:${crypto.randomUUID()}`,
      labels: {},
    });
    events = [];
    notify();

    return current;
  };

  const addEvent = async (event: MatchEvent) => {
    const match = getCurrentOrThrow();
    const timeline = await api.saveMatchTimeline({
      matchUuid: match.uuid,
      events: [...events, event],
    });

    current = timeline.match;
    events = timeline.events;
    notify();

    return current;
  };

  const getDuration = () => {
    const match = getCurrentOrThrow();

    if (match.startDate === null) return 0;

    return getMatchLiveElapsed(match.startDate, events, now());
  };

  return {
    match: () => current,
    events: () => events,

    schedule: (startDate) => createMatch('SCHEDULED', startDate),

    start: async (startDate = new Date(now())) => {
      if (current?.status !== 'SCHEDULED') {
        return createMatch('ONGOING', startDate);
      }

      current = await api.updateMatch({
        uuid: current.uuid,
        status: 'ONGOING',
        startDate,
      });
      notify();

      return current;
    },

    attach: (match, attachedEvents) => {
      current = match;
      events = attachedEvents;
      notify();
    },

    goal: (side, goalOptions = {}) => {
      const ownGoal = goalOptions.ownGoal ?? false;
      const scoringPlayers =
        side === 'SIDE_1' ? setup.playersSide1 : setup.playersSide2;

      return addEvent({
        ...getBase(),
        type: 'GOAL',
        side,
        player: goalOptions.player ?? pickRandom(scoringPlayers),
        ownGoal,
        goalType: goalOptions.goalType ?? [],
      });
    },

    ballOut: () => addEvent({ ...getBase(), type: 'BALL_OUT' }),

    positionChange: (side) =>
      addEvent({ ...getBase(), type: 'POSITION_CHANGE', side }),

    pause: (details) =>
      addEvent({
        ...getBase(),
        type: 'PAUSE',
        details: details ?? null,
        countsAsPresence: false,
      }),

    resume: () => addEvent({ ...getBase(), type: 'RESUME' }),

    surrender: async (side) => {
      await addEvent({ ...getBase(), type: 'SURRENDER', side, details: null });

      current = await api.updateMatch({
        uuid: getCurrentOrThrow().uuid,
        duration: getDuration(),
      });
      notify();

      return current;
    },

    cancel: async (details) => {
      await addEvent({
        ...getBase(),
        type: 'CANCEL',
        details: details ?? null,
      });

      current = await api.updateMatch({
        uuid: getCurrentOrThrow().uuid,
        duration: getDuration(),
      });
      notify();

      return current;
    },

    finish: async () => {
      current = await api.updateMatch({
        uuid: getCurrentOrThrow().uuid,
        duration: getDuration(),
      });
      notify();

      return current;
    },

    remove: async () => {
      if (current === null) return;

      await api.deleteMatch(current.uuid);

      current = null;
      events = [];
      notify();
    },
  };
}
