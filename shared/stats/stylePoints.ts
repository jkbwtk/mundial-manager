import {
  getGoalScoringSide,
  getMatchSidePlayers,
  getMatchTimelineSteps,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { StylePointsConfig } from '#shared/types/api/season';
import type { StatsMatch } from '#shared/types/stats/statsRow';

function getTierPoints(tiers: Record<string, number>, value: number): number {
  const reached = Object.keys(tiers)
    .map(Number)
    .filter((tier) => tier <= value);

  if (reached.length === 0) return 0;

  return tiers[Math.max(...reached).toString()] ?? 0;
}

export function calculateMatchStylePoints(
  match: Pick<
    StatsMatch,
    | 'status'
    | 'events'
    | 'side1Score'
    | 'side2Score'
    | 'playersSide1'
    | 'playersSide2'
  >,
  config: StylePointsConfig,
  getGoalTypePoints: (uuid: string) => number,
): Record<string, number> {
  const points: Record<string, number> = {};
  const deficits: Record<MatchSide, number> = { SIDE_1: 0, SIDE_2: 0 };

  let runSide: MatchSide | null = null;
  let runLength = 0;

  const addPoints = (uuid: string, value: number) => {
    points[uuid] = (points[uuid] ?? 0) + value;
  };

  if (match.status === 'CANCELED') return points;

  for (const { event, score } of getMatchTimelineSteps(match.events)) {
    if (event.type !== 'GOAL') continue;

    const side = getGoalScoringSide(event);
    const value = event.goalType.reduce(
      (sum, uuid) => sum + getGoalTypePoints(uuid),
      0,
    );

    addPoints(event.player, event.ownGoal ? -value : value);

    if (runSide === side) {
      runLength += 1;
    } else if (!event.ownGoal || runSide === null) {
      runSide = side;
      runLength = 1;
    }

    if (!event.ownGoal && runSide === side) {
      addPoints(event.player, getTierPoints(config.streaks, runLength));
    }

    deficits.SIDE_1 = Math.max(deficits.SIDE_1, score[1] - score[0]);
    deficits.SIDE_2 = Math.max(deficits.SIDE_2, score[0] - score[1]);
  }

  const winner = getMatchWinningSide(match);

  if (match.status !== 'FINISHED' || winner === null) return points;

  const winners = getMatchSidePlayers(match, winner);
  const bonus = getTierPoints(config.comebacks, deficits[winner]);

  for (const uuid of winners) {
    addPoints(uuid, bonus / winners.length);
  }

  return points;
}
