import { getMatchSidePlayers, getOppositeSide } from '#shared/matchTimeline';
import { MatchStatusEnum } from '#shared/types/api/match';
import { type MatchSide, MatchSides } from '#shared/types/api/matchEvent';
import type {
  LineupHeadToHead,
  MatchPredictionQuery,
  MatchPreviewOutcome,
  MatchPreviewPlayer,
} from '#shared/types/api/stats';
import type { StatsRow } from '#shared/types/stats/statsRow';

const MATCH_PREVIEW_RECENT_LIMIT = 5;

function isSameLineup(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((uuid) => b.includes(uuid));
}

function getOutcome(row: StatsRow, side: MatchSide): MatchPreviewOutcome {
  if (row.winningSide === null) return 'DRAW';

  return row.winningSide === side ? 'WIN' : 'LOSS';
}

function isDecidedRow(row: StatsRow): boolean {
  return row.match.status !== MatchStatusEnum.CANCELED;
}

export function calculateLineupHeadToHead(
  rows: StatsRow[],
  query: MatchPredictionQuery,
): LineupHeadToHead {
  const record: LineupHeadToHead = { wins: 0, draws: 0, losses: 0, last: null };

  for (const row of rows) {
    if (!isDecidedRow(row)) continue;

    const side = MatchSides.find(
      (candidate) =>
        isSameLineup(
          getMatchSidePlayers(row.match, candidate),
          query.playersSide1,
        ) &&
        isSameLineup(
          getMatchSidePlayers(row.match, getOppositeSide(candidate)),
          query.playersSide2,
        ),
    );

    if (side === undefined) continue;

    const outcome = getOutcome(row, side);
    const { side1Score, side2Score } = row.match;

    record.wins += outcome === 'WIN' ? 1 : 0;
    record.draws += outcome === 'DRAW' ? 1 : 0;
    record.losses += outcome === 'LOSS' ? 1 : 0;
    record.last = {
      matchUuid: row.match.uuid,
      startDate: row.match.startDate,
      score:
        side === 'SIDE_1' ? [side1Score, side2Score] : [side2Score, side1Score],
      outcome,
    };
  }

  return record;
}

export function calculateMatchPreviewPlayer(
  rows: StatsRow[],
  uuid: string,
  elo: number | null,
): MatchPreviewPlayer {
  const recent: MatchPreviewOutcome[] = [];

  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let isStreakOpen = true;

  for (const row of rows.toReversed()) {
    const player = row.players.find((entry) => entry.uuid === uuid);

    if (!player?.side || !isDecidedRow(row)) continue;

    const outcome = getOutcome(row, player.side);

    if (recent.length < MATCH_PREVIEW_RECENT_LIMIT) recent.push(outcome);

    if (isStreakOpen && outcome === 'WIN' && currentLossStreak === 0) {
      currentWinStreak += 1;
    } else if (isStreakOpen && outcome === 'LOSS' && currentWinStreak === 0) {
      currentLossStreak += 1;
    } else {
      isStreakOpen = false;
    }

    if (!isStreakOpen && recent.length >= MATCH_PREVIEW_RECENT_LIMIT) break;
  }

  return { uuid, elo, currentWinStreak, currentLossStreak, recent };
}
