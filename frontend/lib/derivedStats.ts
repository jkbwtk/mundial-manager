import type { AggregateStats } from '#shared/types/stats/generalStats';
import type { PlayerStats } from '#shared/types/stats/playerStats';
import { clamp } from '#shared/utils';

const GLICKO2_MIN_RD = 30;

export function divide(value: number, divisor: number): number | null {
  return divisor === 0 ? null : value / divisor;
}

export function getAverageMatchDuration(
  stats: Pick<AggregateStats, 'playtime' | '_matchesWithDuration'>,
): number | null {
  return divide(stats.playtime, stats._matchesWithDuration);
}

export function getWinRate(
  stats: Pick<PlayerStats, 'wins' | 'losses' | 'draws'>,
): number | null {
  return divide(stats.wins, stats.wins + stats.losses + stats.draws);
}

export function getGoalDifference(
  stats: Pick<PlayerStats, 'goalsFor' | 'goalsAgainst'>,
): number {
  return stats.goalsFor - stats.goalsAgainst;
}

export function getRatingConfidence(rd: number, defaultRd: number): number {
  return clamp(0, 1, (defaultRd - rd) / (defaultRd - GLICKO2_MIN_RD)) * 100;
}
