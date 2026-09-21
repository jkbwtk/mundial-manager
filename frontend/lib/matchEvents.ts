import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { getGoalScoringSide } from '#shared/matchTimeline';
import { formatDuration } from '#shared/timeUtils';
import type {
  GoalType,
  MatchEvent,
  MatchEventType,
  MatchSide,
} from '#shared/types/api/matchEvent';

export interface MatchEventDefaults {
  playersSide1: string[];
  playersSide2: string[];
  ballUuid?: string | null;
}

export const MatchEventTypeLabels: Record<MatchEventType, string> = {
  GOAL: 'Goal',
  POSITION_CHANGE: 'Position change',
  BALL_OUT: 'Ball out',
  BALL_CHANGE: 'Ball change',
  EQUIPMENT_FAILURE: 'Equipment failure',
  PAUSE: 'Pause',
  RESUME: 'Resume',
  CANCEL: 'Cancel',
};

export const MatchEventTypeSymbols: Record<
  MatchEventType,
  SupportedMaterialSymbol
> = {
  GOAL: 'sports_soccer',
  POSITION_CHANGE: 'swap_horiz',
  BALL_OUT: 'display_external_input',
  BALL_CHANGE: 'change_circle',
  EQUIPMENT_FAILURE: 'nearby_error',
  PAUSE: 'pause',
  RESUME: 'play_arrow',
  CANCEL: 'cancel',
};

export const GoalTypeLabels: Record<GoalType, string> = {
  AERIAL_GOAL: 'Aerial',
  BACK_STAB_GOAL: 'Back stab',
  PARRY_GOAL: 'Parry',
  RETURN_TO_FIELD_GOAL: 'Return to field',
  TRICK_SHOT_GOAL: 'Trick shot',
  LONG_SHOT_GOAL: 'Long shot',
  SLOW_GOAL: 'Slow',
  FAST_GOAL: 'Fast',
  GUARD_PIERCE_GOAL: 'Guard pierce',
  PUSH_GOAL: 'Push',
  BERMUDA_TRIANGLE_GOAL: 'Bermuda triangle',
};

export const MatchSideLabels: Record<MatchSide, string> = {
  SIDE_1: 'Side 1',
  SIDE_2: 'Side 2',
};

export function getMatchEventLane(event: MatchEvent): MatchSide | null {
  switch (event.type) {
    case 'GOAL':
      return getGoalScoringSide(event);
    case 'POSITION_CHANGE':
      return event.side;
    default:
      return null;
  }
}

export function formatElapsed(ms: number): string {
  const sign = ms < 0 ? '-' : '';
  const absolute = Math.abs(ms);
  const seconds = Math.floor(absolute / 1000);
  const tenths = Math.floor((absolute % 1000) / 100);

  return `${sign}${formatDuration(seconds)}${tenths > 0 ? `.${tenths}` : ''}`;
}

export function createMatchEvent(
  type: MatchEventType,
  offset: number,
  defaults: MatchEventDefaults,
  side: MatchSide = 'SIDE_1',
): MatchEvent {
  const base = {
    uuid: crypto.randomUUID(),
    offset,
    labels: {},
  };

  const sidePlayers =
    side === 'SIDE_1' ? defaults.playersSide1 : defaults.playersSide2;

  switch (type) {
    case 'GOAL':
      return {
        ...base,
        type,
        side,
        player: sidePlayers[0] ?? '',
        ownGoal: false,
        goalType: [],
      };

    case 'POSITION_CHANGE':
      return { ...base, type, side };

    case 'BALL_CHANGE':
      return { ...base, type, ball: defaults.ballUuid ?? '' };

    case 'EQUIPMENT_FAILURE':
    case 'PAUSE':
    case 'CANCEL':
      return { ...base, type, details: null };

    default:
      return { ...base, type };
  }
}

export function convertMatchEvent(
  event: MatchEvent,
  type: MatchEventType,
  defaults: MatchEventDefaults,
): MatchEvent {
  const side = 'side' in event ? event.side : 'SIDE_1';
  const converted = createMatchEvent(type, event.offset, defaults, side);

  return {
    ...converted,
    uuid: event.uuid,
    labels: event.labels,
    ...('details' in event && 'details' in converted
      ? { details: event.details }
      : {}),
  } as MatchEvent;
}
