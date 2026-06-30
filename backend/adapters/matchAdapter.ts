import dayjs from 'dayjs';
import { getPlayersFromTeam } from '#flib/sheetUtils';
import { getPauseDuration } from '#shared/matchUtils';
import type {
  MatchEvent,
  MatchEventCreateWithoutMatch,
  MatchSide,
} from '#shared/types/api/matchEvent';
import type { MatchFull, MatchFullCreate } from '#shared/types/api/matchFull';
import type { Player } from '#shared/types/api/player';
import type { Table } from '#shared/types/api/table';
import type {
  Match as LegacyMatch,
  MatchCreate as LegacyMatchCreate,
  MatchEvent as LegacyMatchEvent,
} from '#shared/types/Sheets';

export function getLegacyColorsFromTable(table?: Table): string[] {
  if (!table) return [];

  return table.labels
    .filter((l) => l.startsWith('legacyImportSide'))
    .map((l) => l.split('=').at(1))
    .filter((c) => c !== undefined);
}

export function getLegacyFloorFromTable(table?: Table): number | null {
  const floorStr = table?.labels
    .find((l) => l.startsWith('legacyImportFloor'))
    ?.split('=')
    .at(1);
  const floorInt = Number(floorStr);

  return Number.isNaN(floorInt) ? null : floorInt;
}

function getMatchTable(
  match: LegacyMatchCreate,
  tables: Record<string, Table>,
): Table | null {
  if (match.winningColor === 'unknown') {
    return null;
  }

  return (
    Object.values(tables).find((table) =>
      getLegacyColorsFromTable(table).includes(match.winningColor),
    ) ?? null
  );
}

function checkIfSwapRequired(match: LegacyMatchCreate, table?: Table): boolean {
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
  tables: Record<string, Table>,
  players: Record<string, Player>,
): MatchFullCreate {
  const table = getMatchTable(match, tables);
  const swapRequired = table ? checkIfSwapRequired(match, table) : false;

  return {
    tableUuid: table?.uuid,

    startDate: new Date((match.date ?? 0) * 1000),

    duration: match.duration ?? 0,
    pauseDuration: match.replayMetadata
      ? getPauseDuration(match.replayMetadata.events)
      : 0,

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

    labels: [`legacyImportSwap=${String(swapRequired)}`],
  };
}

export function convertFromLegacyMatchEvent(
  match: LegacyMatchCreate,
  event: LegacyMatchEvent,
  players: Record<string, Player>,
  swapRequired = false,
): MatchEventCreateWithoutMatch | null {
  const common = {
    time: new Date(event.time * 1000),
  } as const;

  const S1: MatchSide = swapRequired ? 'SIDE_2' : 'SIDE_1';
  const S2: MatchSide = swapRequired ? 'SIDE_1' : 'SIDE_2';

  switch (event.type) {
    case 'GOAL': {
      let side: MatchSide = S1;

      side = event.player && match.team1.includes(event.player) ? S1 : S2;

      return {
        ...common,

        type: 'GOAL',
        goalType: event.goalType,
        player: players[event.player ?? '']?.uuid ?? '',
        ownGoal: event.for !== event.by,
        side,
      };
    }

    case 'POSITION_CHANGE': {
      let side: MatchSide = S1;

      if (event.side === match.winningColor) {
        side = match.score1 > match.score2 ? S1 : S2;
      } else {
        side = match.score1 > match.score2 ? S2 : S1;
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

export function convertToLegacyMatch(
  match: MatchFull,
  players: Record<string, Player>,
  index?: number,
): LegacyMatch {
  const colors = getLegacyColorsFromTable(match.table ?? undefined);

  return {
    id: index ?? 0,

    team1: match.playersSide1
      .map((uuid) => players[uuid]?.name ?? uuid)
      .sort()
      .join(' '),
    team2: match.playersSide2
      .map((uuid) => players[uuid]?.name ?? uuid)
      .sort()
      .join(' '),

    score1: match.side1Score,
    score2: match.side2Score,

    floor: getLegacyFloorFromTable(match.table ?? undefined),
    winningColor:
      (match.side1Score > match.side2Score ? colors.at(0) : colors.at(1)) ??
      'unknown',

    duration: match.duration,
    pauseDuration: match.pauseDuration ?? 0,

    date:
      match.startDate.getTime() === 0
        ? null
        : dayjs(match.startDate).startOf('day').unix(),
    hash: match.hash,

    replayMetadata:
      match.events.length !== 0 && match.events.at(0)?.type === 'MATCH_START'
        ? {
            startedAt: (match.events.at(0)?.time.getTime() ?? 0) / 1000,
            events: match.events
              .map((event) => convertToLegacyMatchEvent(match, event, players))
              .filter((event) => event !== null),
          }
        : null,
  };
}

export function convertToLegacyMatchEvent(
  match: MatchFull,
  event: MatchEvent,
  players: Record<string, Player>,
): LegacyMatchEvent | null {
  const common = {
    time: event.time.getTime() / 1000,
  } as const;

  const colors = match.table ? getLegacyColorsFromTable(match.table) : [];

  try {
    switch (event.type) {
      case 'GOAL': {
        if (!match.table) return null;

        const teamColor =
          (event.side === 'SIDE_1' ? colors.at(0) : colors.at(1)) ?? 'unknown';
        const opponentColor =
          colors.find((color) => color !== teamColor) ?? 'unknown';

        return {
          ...common,

          type: 'GOAL',
          player: players[event.player]?.name ?? null,
          goalType: event.goalType,
          by: teamColor,
          for: event.ownGoal ? opponentColor : teamColor,
        };
      }

      case 'BALL_OUT':
        return {
          ...common,

          type: 'BALL_OUT',
        };

      case 'POSITION_CHANGE':
        if (!match.table) return null;

        return {
          ...common,

          type: 'POSITION_CHANGE',
          side:
            (event.side === 'SIDE_1' ? colors.at(0) : colors.at(1)) ??
            'unknown',
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
          reason: event.details,
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
          reason: event.details,
        };

      default:
        return null;
    }
  } catch {
    return null;
  }
}
