import { getModelErrorMessage } from '#shared/modelErrors';
import type { Match } from '#shared/types/api/match';
import type {
  MatchEventCreate,
  MatchEventGoal,
  MatchEventType,
  MatchSide,
} from '#shared/types/api/matchEvent';
import {
  type MatchTimelineErrorType,
  MatchTimelineErrorTypeEnum,
  type MatchTimelineIssue,
  type MatchTimelineIssueSeverity,
  MatchTimelineIssueSeverityEnum,
} from '#shared/types/api/matchTimeline';

export type MatchTimelineEntry = MatchEventCreate & {
  uuid?: string;
};

export interface MatchTimelineContext {
  playersSide1?: string[];
  playersSide2?: string[];

  duration?: number | null;
}

export interface MatchTimelineStep<T extends MatchTimelineEntry> {
  event: T;

  elapsed: number;
  activeElapsed: number;
  pauseDuration: number;

  score: [number, number];

  paused: boolean;
  pausedBefore: boolean;
  pausedAfter: boolean;
}

export interface MatchTimelineStats {
  counts: Partial<Record<MatchEventType, number>>;
  ownGoals: number;

  goalsPerMinute: number | null;
  averageTimeBetweenGoals: number | null;
  longestTimeBetweenGoals: number | null;
  shortestTimeBetweenGoals: number | null;

  leadChanges: number;
  biggestLead: number;
}

export interface MatchTimelineValidationState {
  events: MatchTimelineEntry[];
  steps: MatchTimelineStep<MatchTimelineEntry>[];
  played: MatchTimelineStep<MatchTimelineEntry>[];

  context: MatchTimelineContext;

  report: (
    severity: MatchTimelineIssueSeverity,
    errorType: MatchTimelineErrorType,
    event: MatchTimelineEntry | null,
    field?: string | null,
  ) => void;
}

export type MatchTimelineValidationStrategy = (
  state: MatchTimelineValidationState,
) => void;

const MATCH_END_TOLERANCE_MS = 1000;

const MatchTimelineErrorMessages: Record<MatchTimelineErrorType, string> = {
  DUPLICATE_EVENT_UUID: 'Event identifier is used more than once',
  EVENT_BEFORE_MATCH_START: 'Event happens before the match start',
  EVENT_AFTER_MATCH_END: 'Event happens after the match end',
  CANCEL_DUPLICATE: 'Timeline can contain only one "CANCEL" event',
  EVENT_AFTER_CANCEL: 'Event happens after the match was cancelled',
  PAUSE_ALREADY_ACTIVE: 'Match is already paused',
  RESUME_WITHOUT_PAUSE: 'Match is resumed without being paused',
  PAUSE_NOT_RESUMED: 'Pause is never resumed',
  EVENT_DURING_PAUSE: 'Event happens while the match is paused',
  GOAL_PLAYER_NOT_IN_SIDE: 'Player does not play on the selected side',
  GOAL_TYPE_DUPLICATE: 'Goal type is listed more than once',
  PLAYERS_NOT_FOUND: 'Player no longer exists',
  BALL_NOT_FOUND: 'Ball no longer exists',
  MATCH_NOT_FOUND: 'Match does not exist',
};

const PlayEventTypes: Set<MatchEventType> = new Set([
  'GOAL',
  // 'POSITION_CHANGE',
  'BALL_OUT',
  // 'BALL_CHANGE',
]);

const { ERROR, WARNING } = MatchTimelineIssueSeverityEnum;

export function getMatchTimelineErrorMessage(errorType: string): string {
  return (
    MatchTimelineErrorMessages[errorType as MatchTimelineErrorType] ??
    getModelErrorMessage(errorType)
  );
}

export function isMatchTimelineError(
  issue: Pick<MatchTimelineIssue, 'severity'>,
): boolean {
  return issue.severity === MatchTimelineIssueSeverityEnum.ERROR;
}

export function hasMatchTimelineErrors(
  issues: Pick<MatchTimelineIssue, 'severity'>[],
): boolean {
  return issues.some(isMatchTimelineError);
}

export function getMatchTimelineReferences(events: MatchTimelineEntry[]): {
  playerUuids: Set<string>;
  ballUuids: Set<string>;
} {
  const playerUuids = new Set<string>();
  const ballUuids = new Set<string>();

  for (const event of events) {
    if (event.type === 'GOAL') playerUuids.add(event.player);
    if (event.type === 'BALL_CHANGE') ballUuids.add(event.ball);
  }

  return { playerUuids, ballUuids };
}

export function getMatchTimelineContext(
  match: Pick<Match, 'playersSide1' | 'playersSide2' | 'duration'>,
): MatchTimelineContext {
  return {
    playersSide1: match.playersSide1,
    playersSide2: match.playersSide2,
    duration: match.duration,
  };
}

function getOppositeSide(side: MatchSide): MatchSide {
  return side === 'SIDE_1' ? 'SIDE_2' : 'SIDE_1';
}

export function getGoalScoringSide(
  event: Pick<MatchEventGoal, 'side' | 'ownGoal'>,
): MatchSide {
  return event.ownGoal ? getOppositeSide(event.side) : event.side;
}

function getTieBreakPriority(type: MatchEventType): number {
  return type === 'CANCEL' ? 1 : 0;
}

export function sortMatchTimeline<T extends MatchTimelineEntry>(
  events: T[],
): T[] {
  return events.toSorted(
    (a, b) =>
      a.offset - b.offset ||
      getTieBreakPriority(a.type) - getTieBreakPriority(b.type),
  );
}

export function getMatchTimelineSteps<T extends MatchTimelineEntry>(
  events: T[],
): MatchTimelineStep<T>[] {
  const score: [number, number] = [0, 0];

  let pausedAt: number | null = null;
  let pauseDuration = 0;

  return sortMatchTimeline(events).map((event) => {
    const pausedBefore = pausedAt !== null;

    if (event.type === 'PAUSE' && pausedAt === null) {
      pausedAt = event.offset;
    } else if (event.type === 'RESUME' && pausedAt !== null) {
      pauseDuration += event.offset - pausedAt;
      pausedAt = null;
    }

    if (event.type === 'GOAL') {
      score[getGoalScoringSide(event) === 'SIDE_1' ? 0 : 1] += 1;
    }

    const pausedAfter = pausedAt !== null;

    return {
      event,
      elapsed: event.offset,
      activeElapsed: event.offset - pauseDuration,
      pauseDuration: pauseDuration,
      score: [score[0], score[1]],
      paused: pausedBefore && pausedAfter,
      pausedBefore,
      pausedAfter,
    };
  });
}

export function getMatchTimelineScore(
  events: MatchTimelineEntry[],
): [number, number] {
  return getMatchTimelineSteps(events).at(-1)?.score ?? [0, 0];
}

export function getMatchTimelinePauseDuration(
  events: MatchTimelineEntry[],
): number {
  return getMatchTimelineSteps(events).at(-1)?.pauseDuration ?? 0;
}

export function hasOpenMatchPause(events: MatchTimelineEntry[]): boolean {
  return getMatchTimelineSteps(events).at(-1)?.pausedAfter ?? false;
}

export function getMatchTimelineStats(
  events: MatchTimelineEntry[],
  duration: number | null,
): MatchTimelineStats {
  const steps = getMatchTimelineSteps(events);

  const goals = steps.flatMap((step) =>
    step.event.type === 'GOAL'
      ? [
          {
            activeElapsed: step.activeElapsed,
            score: step.score,
            ownGoal: step.event.ownGoal,
          },
        ]
      : [],
  );

  const counts: MatchTimelineStats['counts'] = {};

  for (const { event } of steps) {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
  }

  const gaps = goals
    .slice(1)
    .map((goal, index) => goal.activeElapsed - goals[index]!.activeElapsed);

  let leader = 0;
  let leadChanges = 0;
  let biggestLead = 0;

  for (const goal of goals) {
    const lead = goal.score[0] - goal.score[1];
    const currentLeader = Math.sign(lead);

    if (currentLeader !== 0 && leader !== 0 && currentLeader !== leader) {
      leadChanges += 1;
    }

    if (currentLeader !== 0) {
      leader = currentLeader;
    }

    biggestLead = Math.max(biggestLead, Math.abs(lead));
  }

  return {
    counts,
    ownGoals: goals.filter((goal) => goal.ownGoal).length,

    goalsPerMinute: duration ? goals.length / (duration / 60_000) : null,
    averageTimeBetweenGoals:
      gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
    longestTimeBetweenGoals: gaps.length > 0 ? Math.max(...gaps) : null,
    shortestTimeBetweenGoals: gaps.length > 0 ? Math.min(...gaps) : null,

    leadChanges,
    biggestLead,
  };
}

export const matchTimelineValidationStrategies = {
  uniqueEventUuids: ({ events, report }) => {
    const seenUuids = new Set<string>();

    for (const event of events) {
      if (event.uuid === undefined) continue;

      if (seenUuids.has(event.uuid)) {
        report(
          ERROR,
          MatchTimelineErrorTypeEnum.DUPLICATE_EVENT_UUID,
          event,
          'uuid',
        );
      }

      seenUuids.add(event.uuid);
    }
  },

  noEventsBeforeStart: ({ steps, report }) => {
    for (const { event } of steps) {
      if (event.offset >= 0) break;

      report(
        ERROR,
        MatchTimelineErrorTypeEnum.EVENT_BEFORE_MATCH_START,
        event,
        'offset',
      );
    }
  },

  noEventsAfterCancel: ({ steps, played, report }) => {
    for (const { event } of steps.slice(played.length)) {
      const isCancel = event.type === 'CANCEL';

      report(
        ERROR,
        isCancel
          ? MatchTimelineErrorTypeEnum.CANCEL_DUPLICATE
          : MatchTimelineErrorTypeEnum.EVENT_AFTER_CANCEL,
        event,
        isCancel ? 'type' : 'offset',
      );
    }
  },

  pausesAreResumed: ({ played, report }) => {
    let openPause: MatchTimelineEntry | null = null;

    for (const step of played) {
      const { event } = step;

      if (event.type === 'PAUSE') {
        if (step.paused) {
          report(
            ERROR,
            MatchTimelineErrorTypeEnum.PAUSE_ALREADY_ACTIVE,
            event,
            'offset',
          );
        } else {
          openPause = event;
        }
      }

      if (event.type === 'RESUME') {
        if (!step.pausedBefore) {
          report(
            ERROR,
            MatchTimelineErrorTypeEnum.RESUME_WITHOUT_PAUSE,
            event,
            'offset',
          );
        }

        openPause = null;
      }
    }

    if (openPause !== null && played.at(-1)?.event.type !== 'CANCEL') {
      report(
        WARNING,
        MatchTimelineErrorTypeEnum.PAUSE_NOT_RESUMED,
        openPause,
        'offset',
      );
    }
  },

  noPlayDuringPause: ({ played, report }) => {
    for (const step of played) {
      if (step.paused && PlayEventTypes.has(step.event.type)) {
        report(
          WARNING,
          MatchTimelineErrorTypeEnum.EVENT_DURING_PAUSE,
          step.event,
          'offset',
        );
      }
    }
  },

  withinMatchDuration: ({ steps, context, report }) => {
    if (context.duration == null) return;

    const endOffset = context.duration + (steps.at(-1)?.pauseDuration ?? 0);

    for (const { event } of steps) {
      if (event.offset > endOffset + MATCH_END_TOLERANCE_MS) {
        report(
          WARNING,
          MatchTimelineErrorTypeEnum.EVENT_AFTER_MATCH_END,
          event,
          'offset',
        );
      }
    }
  },

  goalPlayersBelongToSide: ({ events, context, report }) => {
    const { playersSide1, playersSide2 } = context;

    if (playersSide1 === undefined || playersSide2 === undefined) return;

    for (const event of events) {
      if (event.type !== 'GOAL') continue;

      const sidePlayers = event.side === 'SIDE_1' ? playersSide1 : playersSide2;

      if (!sidePlayers.includes(event.player)) {
        report(
          ERROR,
          MatchTimelineErrorTypeEnum.GOAL_PLAYER_NOT_IN_SIDE,
          event,
          'player',
        );
      }
    }
  },

  uniqueGoalTypes: ({ events, report }) => {
    for (const event of events) {
      if (event.type !== 'GOAL' || !Array.isArray(event.goalType)) continue;

      if (new Set(event.goalType).size !== event.goalType.length) {
        report(
          WARNING,
          MatchTimelineErrorTypeEnum.GOAL_TYPE_DUPLICATE,
          event,
          'goalType',
        );
      }
    }
  },
} satisfies Record<string, MatchTimelineValidationStrategy>;

export function validateMatchTimeline(
  events: MatchTimelineEntry[],
  context: MatchTimelineContext = {},
  strategies: Record<
    string,
    MatchTimelineValidationStrategy
  > = matchTimelineValidationStrategies,
): MatchTimelineIssue[] {
  const issues: MatchTimelineIssue[] = [];

  if (events.length === 0) {
    return issues;
  }

  const indices = new Map<MatchTimelineEntry, number>(
    events.map((event, index) => [event, index]),
  );

  const steps = getMatchTimelineSteps(events);
  const cancelIndex = steps.findIndex((step) => step.event.type === 'CANCEL');

  const state: MatchTimelineValidationState = {
    events,
    steps,
    played: cancelIndex === -1 ? steps : steps.slice(0, cancelIndex + 1),
    context,

    report: (severity, errorType, event, field = null) => {
      issues.push({
        severity,
        errorType,
        eventUuid: event?.uuid ?? null,
        eventIndex: event === null ? null : (indices.get(event) ?? null),
        field,
      });
    },
  };

  for (const strategy of Object.values(strategies)) {
    strategy(state);
  }

  return issues;
}
