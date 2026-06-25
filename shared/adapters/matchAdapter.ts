import type { PlayerSelectSchema } from '#backend/types/db/player';
import type { TableSelectSchema } from '#backend/types/db/table';
import { getPlayersFromTeam } from '#flib/sheetUtils';
import type { MatchFullCreate } from '#shared/types/api/match';
import type {
  MatchEventCreateWithoutMatch,
  MatchSide,
} from '#shared/types/api/matchEvent';
import type { Match, MatchEvent } from '#shared/types/Sheets';

export function convertFromLegacyMatch(
  match: Match,
  tables: Record<string, TableSelectSchema>,
  players: Record<string, PlayerSelectSchema>,
): MatchFullCreate {
  return {
    tableUuid: tables[match.floor ?? '']?.uuid,

    startDate: new Date((match.date ?? 0) * 1000),

    duration: Math.floor(match.duration ?? 0),
    pauseDuration: Math.floor(match.pauseDuration),

    side1Score: match.score1,
    side2Score: match.score2,

    status: 'FINISHED',

    playersSide1: getPlayersFromTeam(match.team1).map(
      // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: yeah
      (player) => players[player]?.uuid!,
    ),
    playersSide2: getPlayersFromTeam(match.team2).map(
      // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: yeah
      (player) => players[player]?.uuid!,
    ),

    spectators: [],
    events: match.replayMetadata
      ? [
          {
            type: 'MATCH_START',
            time: new Date(match.replayMetadata.startedAt * 1000),
          },
          ...match.replayMetadata.events
            .map((event) => convertFromLegacyMatchEvent(match, event, players))
            .filter((event) => event !== null),
        ]
      : [],
  };
}

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
