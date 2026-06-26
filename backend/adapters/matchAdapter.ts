import type { PlayerSelectSchema } from '#backend/types/db/player';
import type { TableSelectSchema } from '#backend/types/db/table';
import { getMatchDuration, getPlayersFromTeam } from '#flib/sheetUtils';
import type {
  MatchEventCreateWithoutMatch,
  MatchSide,
} from '#shared/types/api/matchEvent';
import type { MatchFullCreate } from '#shared/types/api/matchFull';
import type {
  MatchCreate as LegacyMatchCreate,
  MatchEvent as LegacyMatchEvent,
} from '#shared/types/Sheets';

function getLegacyColorsFromTable(table: TableSelectSchema): string[] {
  return table.labels
    .filter((l) => l.startsWith('legacyImportSide'))
    .map((l) => l.split('=').at(1))
    .filter((c) => c !== undefined);
}

function getMatchTable(
  match: LegacyMatchCreate,
  tables: Record<string, TableSelectSchema>,
): TableSelectSchema | null {
  if (match.winningColor === 'unknown') {
    return null;
  }

  return (
    Object.values(tables).find((table) =>
      getLegacyColorsFromTable(table).includes(match.winningColor),
    ) ?? null
  );
}

function checkIfSwapRequired(
  match: LegacyMatchCreate,
  table?: TableSelectSchema,
): boolean {
  if (table) {
    const side1Color = table.labels
      .find((v) => v.startsWith('legacyImportSide1Color'))
      ?.split('=')
      .at(1)
      ?.trim();

    if (side1Color !== undefined && match.winningColor !== 'unknown') {
      if (side1Color === match.winningColor && match.score1 < match.score2) {
        return true;
      }

      if (side1Color !== match.winningColor && match.score1 > match.score2) {
        return true;
      }
    }
  }

  return false;
}

export function convertFromLegacyMatch(
  match: LegacyMatchCreate,
  tables: Record<string, TableSelectSchema>,
  players: Record<string, PlayerSelectSchema>,
): MatchFullCreate {
  const table = getMatchTable(match, tables);
  const swapRequired = table ? checkIfSwapRequired(match, table) : false;

  return {
    tableUuid: table?.uuid,

    startDate: new Date((match.date ?? 0) * 1000),

    duration: Math.floor(match.duration ?? 0),
    pauseDuration: Math.floor(
      match.replayMetadata
        ? getMatchDuration({
            events: match.replayMetadata.events,
            startedAt: match.replayMetadata.startedAt,
          })
        : 0,
    ),

    side1Score: swapRequired ? match.score2 : match.score1,
    side2Score: swapRequired ? match.score1 : match.score2,

    status: 'FINISHED',

    playersSide1: getPlayersFromTeam(
      swapRequired ? match.team2 : match.team1,
    ).map(
      // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: yeah
      (player) => players[player]?.uuid!,
    ),
    playersSide2: getPlayersFromTeam(
      swapRequired ? match.team1 : match.team2,
    ).map(
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
            .map((event) =>
              convertFromLegacyMatchEvent(match, event, players, swapRequired),
            )
            .filter((event) => event !== null),
        ]
      : [],
  };
}

export function convertFromLegacyMatchEvent(
  match: LegacyMatchCreate,
  event: LegacyMatchEvent,
  players: Record<string, PlayerSelectSchema>,
  swapRequired = false,
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
      const S1 = swapRequired ? 'SIDE_2' : 'SIDE_1';
      const S2 = swapRequired ? 'SIDE_1' : 'SIDE_2';

      let side: MatchSide = S1;

      if (event.side === match.winningColor) {
        side = match.score1 > match.score2 ? S1 : S2;
      } else {
        side = match.score1 > match.score2 ? S1 : S2;
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
