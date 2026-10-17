import { getMatchPlayerUuids } from '#shared/matchPlayers';
import type { MatchTimelineStats } from '#shared/matchTimeline';
import {
  countValues,
  mergeCounts,
  mergeNullable,
  mergeUnique,
  sum,
} from '#shared/stats/utils';
import { MatchStatusEnum } from '#shared/types/api/match';
import type { AggregateStats } from '#shared/types/stats/generalStats';
import type { StatsMatch } from '#shared/types/stats/statsRow';

export function calculateMatchStats(
  match: StatsMatch,
  timeline: MatchTimelineStats,
  sessionPresence: number,
): AggregateStats {
  const playerUuids = getMatchPlayerUuids(match);
  const players = playerUuids.length;
  const goals = match.side1Score + match.side2Score;
  const duration = match.duration ?? 0;
  const hasDuration = duration > 0;
  const gaps = timeline.goalGaps;

  return {
    matches: 1,
    cancelledMatches: match.status === MatchStatusEnum.CANCELED ? 1 : 0,

    players: playerUuids.toSorted(),

    goals,
    ownGoalCount: timeline.ownGoals,
    goalTypesCount: countValues(
      match.events.flatMap((event) =>
        event.type === 'GOAL' && !event.ownGoal ? event.goalType : [],
      ),
    ),

    eventTypesCount: countValues(match.events.map((event) => event.type)),

    playtime: duration,
    participationTime: sessionPresence,
    pauseDuration: match.pauseDuration,
    individualPlaytime: duration * players,

    longestTimeBetweenGoals: timeline.longestTimeBetweenGoals,
    shortestTimeBetweenGoals: timeline.shortestTimeBetweenGoals,

    leadChanges: timeline.leadChanges,
    biggestLead: timeline.biggestLead,

    _totalTimeBetweenGoals: sum(gaps),
    _timeBetweenGoalsCount: gaps.length,
    _goalsWithDuration: hasDuration ? goals : 0,
    _matchesWithDuration: hasDuration ? 1 : 0,
    _matchesWithTimeline: match.events.length > 0 ? 1 : 0,
    _playersWithoutDuration: hasDuration ? 0 : players,
  };
}

export function mergeAggregateStats(
  a: AggregateStats,
  b: AggregateStats,
): AggregateStats {
  return {
    matches: a.matches + b.matches,
    cancelledMatches: a.cancelledMatches + b.cancelledMatches,

    players: mergeUnique(a.players, b.players),

    goals: a.goals + b.goals,
    ownGoalCount: a.ownGoalCount + b.ownGoalCount,
    goalTypesCount: mergeCounts(a.goalTypesCount, b.goalTypesCount),

    eventTypesCount: mergeCounts(a.eventTypesCount, b.eventTypesCount),

    playtime: a.playtime + b.playtime,
    participationTime: a.participationTime + b.participationTime,
    pauseDuration: a.pauseDuration + b.pauseDuration,
    individualPlaytime: a.individualPlaytime + b.individualPlaytime,

    longestTimeBetweenGoals: mergeNullable(
      a.longestTimeBetweenGoals,
      b.longestTimeBetweenGoals,
      Math.max,
    ),
    shortestTimeBetweenGoals: mergeNullable(
      a.shortestTimeBetweenGoals,
      b.shortestTimeBetweenGoals,
      Math.min,
    ),

    leadChanges: a.leadChanges + b.leadChanges,
    biggestLead: Math.max(a.biggestLead, b.biggestLead),

    _totalTimeBetweenGoals: a._totalTimeBetweenGoals + b._totalTimeBetweenGoals,
    _timeBetweenGoalsCount: a._timeBetweenGoalsCount + b._timeBetweenGoalsCount,
    _goalsWithDuration: a._goalsWithDuration + b._goalsWithDuration,
    _matchesWithDuration: a._matchesWithDuration + b._matchesWithDuration,
    _matchesWithTimeline: a._matchesWithTimeline + b._matchesWithTimeline,
    _playersWithoutDuration:
      a._playersWithoutDuration + b._playersWithoutDuration,
  };
}
