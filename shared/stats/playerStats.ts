import { getMatchSidePlayers, getMatchSideScores } from '#shared/matchTimeline';
import { countValues, mergeCounts, mergeNullable } from '#shared/stats/utils';
import { MatchStatusEnum } from '#shared/types/api/match';
import { MatchSides } from '#shared/types/api/matchEvent';
import type { PlayerStats } from '#shared/types/stats/playerStats';
import type {
  StatsMatch,
  StatsRow,
  StatsRowPlayer,
} from '#shared/types/stats/statsRow';

const MatchOutcomeEnum = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  DRAW: 'DRAW',
  CANCELED: 'CANCELED',
} as const;

type MatchOutcome = (typeof MatchOutcomeEnum)[keyof typeof MatchOutcomeEnum];

const { WIN, LOSS, DRAW, CANCELED } = MatchOutcomeEnum;

function getMatchOutcome(
  row: StatsRow,
  goalsFor: number,
  goalsAgainst: number,
): MatchOutcome {
  if (row.match.status === MatchStatusEnum.CANCELED) return CANCELED;
  if (goalsFor === goalsAgainst) return DRAW;

  return goalsFor > goalsAgainst ? WIN : LOSS;
}

function getStreak(
  streak: number,
  isCanceled: boolean,
  isContinued: boolean,
): number {
  if (isCanceled) return streak;

  return isContinued ? streak + 1 : 0;
}

function getDayMatches(previous: PlayerStats, day: string | null): number {
  if (day === null) return previous._dayMatches;

  return day === previous._lastDay ? previous._dayMatches + 1 : 1;
}

export function calculateStatsRowPlayers(
  match: StatsMatch,
  presence: Record<string, number>,
  stylePoints: Record<string, number>,
): StatsRowPlayer[] {
  const getEntry = (
    uuid: string,
    side: StatsRowPlayer['side'],
  ): StatsRowPlayer => {
    const goals = match.events.flatMap((event) =>
      event.type === 'GOAL' && event.player === uuid ? [event] : [],
    );
    const scored = goals.filter((event) => !event.ownGoal);

    return {
      uuid,
      side,

      presence: presence[uuid] ?? 0,

      goals: scored.length,
      ownGoals: goals.length - scored.length,
      goalTypes: scored.flatMap((event) => event.goalType),
      stylePoints: stylePoints[uuid] ?? 0,
    };
  };

  return [
    ...MatchSides.flatMap((side) =>
      getMatchSidePlayers(match, side).map((uuid) => getEntry(uuid, side)),
    ),
    ...match.spectators.map((uuid) => getEntry(uuid, null)),
  ];
}

export function calculatePlayerStats(
  previous: PlayerStats,
  row: StatsRow,
  player: StatsRowPlayer,
): PlayerStats {
  if (player.side === null) {
    return {
      ...previous,
      spectatedMatches: previous.spectatedMatches + 1,
      participationTime: previous.participationTime + player.presence,
    };
  }

  const [goalsFor, goalsAgainst] = getMatchSideScores(row.match, player.side);
  const outcome = getMatchOutcome(row, goalsFor, goalsAgainst);
  const isCanceled = outcome === CANCELED;
  const playtime = row.match.duration ?? 0;
  const currentWinStreak = getStreak(
    previous.currentWinStreak,
    isCanceled,
    outcome === WIN,
  );
  const currentLossStreak = getStreak(
    previous.currentLossStreak,
    isCanceled,
    outcome === LOSS,
  );
  const dayMatches = getDayMatches(previous, row.day);

  return {
    matches: previous.matches + 1,
    spectatedMatches: previous.spectatedMatches,

    wins: previous.wins + (outcome === WIN ? 1 : 0),
    losses: previous.losses + (outcome === LOSS ? 1 : 0),
    draws: previous.draws + (outcome === DRAW ? 1 : 0),
    cancelledMatches: previous.cancelledMatches + (isCanceled ? 1 : 0),

    goalsFor: previous.goalsFor + goalsFor,
    goalsAgainst: previous.goalsAgainst + goalsAgainst,

    goals: previous.goals + player.goals,
    ownGoals: previous.ownGoals + player.ownGoals,
    goalTypesCount: mergeCounts(
      previous.goalTypesCount,
      countValues(player.goalTypes),
    ),
    stylePoints: previous.stylePoints + player.stylePoints,
    mostStylePointsInMatch: isCanceled
      ? previous.mostStylePointsInMatch
      : mergeNullable(
          previous.mostStylePointsInMatch,
          player.stylePoints,
          Math.max,
        ),

    playtime: previous.playtime + playtime,
    participationTime: previous.participationTime + player.presence,

    currentWinStreak,
    longestWinStreak: Math.max(previous.longestWinStreak, currentWinStreak),
    currentLossStreak,
    longestLossStreak: Math.max(previous.longestLossStreak, currentLossStreak),

    mostMatchesInDay: Math.max(previous.mostMatchesInDay, dayMatches),

    _matchesWithDuration:
      previous._matchesWithDuration + (playtime > 0 ? 1 : 0),
    _matchesWithTimeline:
      previous._matchesWithTimeline +
      (row.general._matchesWithTimeline > 0 ? 1 : 0),
    _lastDay: row.day ?? previous._lastDay,
    _dayMatches: dayMatches,
  };
}
