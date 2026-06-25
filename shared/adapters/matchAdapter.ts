import type { PlayerSelectSchema } from '#backend/types/db/player';
import type {
  MatchEventCreateWithoutMatch,
  MatchSide,
} from '#shared/types/api/matchEvent';
import type { Match, MatchEvent } from '#shared/types/Sheets';

export function convertFromLegacyMatchEvent(
  match: Match,
  event: MatchEvent,
  players: Record<string, PlayerSelectSchema>,
): MatchEventCreateWithoutMatch | null {
  const common = {
    time: new Date(event.time * 1000),
  } as const;

  switch (event.type) {
    case 'GOAL':
      return {
        ...common,

        type: 'GOAL',
        goalType: event.goalType,
        player: players[event.player ?? '']?.uuid ?? '',
        ownGoal: event.for !== event.by,
      };

    case 'POSITION_CHANGE': {
      let side: MatchSide = 'SIDE_1';

      if (event.side === match.winningColor) {
        side = match.score1 > match.score2 ? 'SIDE_1' : 'SIDE_2';
      } else {
        side = match.score1 > match.score2 ? 'SIDE_2' : 'SIDE_1';
      }

      return {
        ...common,

        type: 'POSITION_CHANGE',
        side,
      };
    }

    case 'BALL_OUT':
      return {
        ...common,

        type: 'BALL_OUT',
      };

    case 'EQUIPMENT_FAILURE':
      return {
        ...common,

        type: 'EQUIPMENT_FAILURE',
        details: event.details,
      };

    case 'PAUSE':
      return {
        ...common,

        type: 'PAUSE',
        details: event.reason,
      };

    case 'RESUME':
      return {
        ...common,

        type: 'RESUME',
      };

    case 'CANCEL':
      return {
        ...common,

        type: 'CANCEL',
        details: event.reason,
      };

    default:
      return null;
  }
}
