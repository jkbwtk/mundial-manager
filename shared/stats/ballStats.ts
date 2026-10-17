import { getMatchTimelineSteps } from '#shared/matchTimeline';
import { sum } from '#shared/stats/utils';
import type { BallStats } from '#shared/types/stats/ballStats';
import type { StatsMatch, StatsRowBall } from '#shared/types/stats/statsRow';

interface BallSegment {
  ball: string;
  start: number; // milliseconds

  playtime: number; // milliseconds
  goals: number;
  ownGoals: number;
  ballOuts: number;

  changedIn: boolean;
  changedOut: boolean;
}

function createBallSegment(
  ball: string,
  start: number,
  changedIn: boolean,
): BallSegment {
  return {
    ball,
    start,

    playtime: 0,
    goals: 0,
    ownGoals: 0,
    ballOuts: 0,

    changedIn,
    changedOut: false,
  };
}

function getBallSegments(match: StatsMatch): BallSegment[] {
  const segments: BallSegment[] = [];

  let current = match.ballUuid
    ? createBallSegment(match.ballUuid, 0, false)
    : null;

  for (const { event, activeElapsed } of getMatchTimelineSteps(match.events)) {
    if (event.type === 'BALL_CHANGE') {
      if (current !== null) {
        current.playtime = Math.max(0, activeElapsed - current.start);
        current.changedOut = true;
        segments.push(current);
      }

      current = createBallSegment(event.ball, activeElapsed, true);
      continue;
    }

    if (current === null) continue;

    if (event.type === 'GOAL') {
      current.goals += 1;
      current.ownGoals += event.ownGoal ? 1 : 0;
    }

    if (event.type === 'BALL_OUT') current.ballOuts += 1;
  }

  if (current === null) return segments;

  if (match.events.length === 0) {
    current.goals = match.side1Score + match.side2Score;
  }

  current.playtime = Math.max(0, (match.duration ?? 0) - current.start);
  segments.push(current);

  return segments;
}

function calculateBallStats(
  match: StatsMatch,
  segments: BallSegment[],
): BallStats {
  const hasDuration = (match.duration ?? 0) > 0;
  const total = (key: 'playtime' | 'goals' | 'ownGoals' | 'ballOuts') =>
    sum(segments.map((segment) => segment[key]));

  return {
    matches: 1,

    goals: total('goals'),
    ownGoalCount: total('ownGoals'),
    ballOutCount: total('ballOuts'),

    changedInCount: segments.filter((segment) => segment.changedIn).length,
    changedOutCount: segments.filter((segment) => segment.changedOut).length,

    playtime: total('playtime'),

    _matchesWithDuration: hasDuration ? 1 : 0,
    _matchesWithTimeline: match.events.length > 0 ? 1 : 0,
  };
}

function groupBallSegments(
  segments: BallSegment[],
): Map<string, BallSegment[]> {
  const groups = new Map<string, BallSegment[]>();

  for (const segment of segments) {
    groups.getOrInsertComputed(segment.ball, () => []).push(segment);
  }

  return groups;
}

export function calculateStatsRowBalls(match: StatsMatch): StatsRowBall[] {
  return [...groupBallSegments(getBallSegments(match))].map(
    ([uuid, segments]) => ({
      uuid,
      stats: calculateBallStats(match, segments),
    }),
  );
}

export function mergeBallStats(a: BallStats, b: BallStats): BallStats {
  return {
    matches: a.matches + b.matches,

    goals: a.goals + b.goals,
    ownGoalCount: a.ownGoalCount + b.ownGoalCount,
    ballOutCount: a.ballOutCount + b.ballOutCount,

    changedInCount: a.changedInCount + b.changedInCount,
    changedOutCount: a.changedOutCount + b.changedOutCount,

    playtime: a.playtime + b.playtime,

    _matchesWithDuration: a._matchesWithDuration + b._matchesWithDuration,
    _matchesWithTimeline: a._matchesWithTimeline + b._matchesWithTimeline,
  };
}
