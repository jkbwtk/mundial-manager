import { defaultPlayerStats } from '#shared/defaults/playerStats';
import { getMatchSidePlayers, getMatchSideScores } from '#shared/matchTimeline';
import { getStatsBucketEntries } from '#shared/stats/buckets';
import { countValues, mergeCounts } from '#shared/stats/utils';
import { MatchStatusEnum } from '#shared/types/api/match';
import { type MatchSide, MatchSides } from '#shared/types/api/matchEvent';
import {
  PlayerStats,
  PlayerStatsBuckets,
} from '#shared/types/stats/playerStats';
import type { StatsMatchContext } from '#shared/types/stats/statsEngine';
import type { StatsModule } from '#shared/types/stats/statsModule';

const MatchOutcomeEnum = {
  WIN: 'WIN',
  LOSS: 'LOSS',
  DRAW: 'DRAW',
  CANCELED: 'CANCELED',
} as const;

type MatchOutcome = (typeof MatchOutcomeEnum)[keyof typeof MatchOutcomeEnum];

const { WIN, LOSS, DRAW, CANCELED } = MatchOutcomeEnum;

interface PlayerMatch {
  presence: number; // milliseconds

  outcome: MatchOutcome;
  goalsFor: number;
  goalsAgainst: number;

  goals: number;
  ownGoals: number;
  goalTypes: string[];

  playtime: number; // milliseconds
  hasTimeline: boolean;
}

type PlayerStatsUpdate = (previous: PlayerStats) => PlayerStats;

type PlayerStatsEntry = [uuid: string, update: PlayerStatsUpdate];

function getMatchOutcome(
  context: StatsMatchContext,
  goalsFor: number,
  goalsAgainst: number,
): MatchOutcome {
  if (context.match.status === MatchStatusEnum.CANCELED) return CANCELED;
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

function getPlayerMatch(
  context: StatsMatchContext,
  uuid: string,
  side: MatchSide,
): PlayerMatch {
  const { match } = context;
  const [goalsFor, goalsAgainst] = getMatchSideScores(match, side);

  const playerGoals = match.events.flatMap((event) =>
    event.type === 'GOAL' && event.player === uuid ? [event] : [],
  );
  const scoredGoals = playerGoals.filter((event) => !event.ownGoal);

  return {
    presence: context.playerPresence[uuid] ?? 0,

    outcome: getMatchOutcome(context, goalsFor, goalsAgainst),
    goalsFor,
    goalsAgainst,

    goals: scoredGoals.length,
    ownGoals: playerGoals.length - scoredGoals.length,
    goalTypes: scoredGoals.flatMap((event) => event.goalType),

    playtime: match.duration ?? 0,
    hasTimeline: match.events.length > 0,
  };
}

function calculatePlayerStats(
  previous: PlayerStats,
  player: PlayerMatch,
): PlayerStats {
  const { outcome } = player;
  const isCanceled = outcome === CANCELED;
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

  return {
    matches: previous.matches + 1,
    spectatedMatches: previous.spectatedMatches,

    wins: previous.wins + (outcome === WIN ? 1 : 0),
    losses: previous.losses + (outcome === LOSS ? 1 : 0),
    draws: previous.draws + (outcome === DRAW ? 1 : 0),
    cancelledMatches: previous.cancelledMatches + (isCanceled ? 1 : 0),

    goalsFor: previous.goalsFor + player.goalsFor,
    goalsAgainst: previous.goalsAgainst + player.goalsAgainst,

    goals: previous.goals + player.goals,
    ownGoals: previous.ownGoals + player.ownGoals,
    goalTypesCount: mergeCounts(
      previous.goalTypesCount,
      countValues(player.goalTypes),
    ),

    playtime: previous.playtime + player.playtime,
    participationTime: previous.participationTime + player.presence,

    currentWinStreak,
    longestWinStreak: Math.max(previous.longestWinStreak, currentWinStreak),
    currentLossStreak,
    longestLossStreak: Math.max(previous.longestLossStreak, currentLossStreak),

    _matchesWithDuration:
      previous._matchesWithDuration + (player.playtime > 0 ? 1 : 0),
    _matchesWithTimeline:
      previous._matchesWithTimeline + (player.hasTimeline ? 1 : 0),
  };
}

function calculateSpectatorStats(
  previous: PlayerStats,
  presence: number,
): PlayerStats {
  return {
    ...previous,
    spectatedMatches: previous.spectatedMatches + 1,
    participationTime: previous.participationTime + presence,
  };
}

function getPlayerStatsUpdates(context: StatsMatchContext): PlayerStatsEntry[] {
  const players = MatchSides.flatMap((side) =>
    getMatchSidePlayers(context.match, side).map((uuid): PlayerStatsEntry => {
      const player = getPlayerMatch(context, uuid, side);

      return [uuid, (previous) => calculatePlayerStats(previous, player)];
    }),
  );
  const spectators = context.match.spectators.map((uuid): PlayerStatsEntry => {
    const presence = context.playerPresence[uuid] ?? 0;

    return [uuid, (previous) => calculateSpectatorStats(previous, presence)];
  });

  return [...players, ...spectators];
}

export const playerStatsModule = {
  state: PlayerStats,

  getResumeFilters: (previous) =>
    getStatsBucketEntries(previous.buckets, PlayerStatsBuckets).map(
      ([bucket, bucketKey]) => ({ bucket, bucketKey }),
    ),

  apply: (context, getState) => {
    const updates = getPlayerStatsUpdates(context);

    return getStatsBucketEntries(context.buckets, PlayerStatsBuckets).flatMap(
      ([bucket, bucketKey]) =>
        updates.map(([uuid, update]) => ({
          bucket,
          bucketKey,
          subject: uuid,
          state: update(
            getState({ bucket, bucketKey, subject: uuid }) ??
              defaultPlayerStats,
          ),
        })),
    );
  },
} satisfies StatsModule<PlayerStats>;
