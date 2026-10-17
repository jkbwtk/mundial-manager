import type { Match } from '#shared/types/api/match';
import type { Season } from '#shared/types/api/season';

export type StatsSeason = Pick<
  Season,
  'uuid' | 'startDate' | 'endDate' | 'config'
>;

export type StatsBucketMatch = Pick<
  Match,
  'uuid' | 'tableUuid' | 'startDate' | 'duration' | 'pauseDuration' | 'labels'
>;

export interface StatsSessionState {
  key: string;

  matchEnd: number; // epoch milliseconds
  players: Record<string, number>; // epoch milliseconds
}

export interface StatsBucketContext {
  timeZone: string;
  season: StatsSeason | null;

  sessions: Record<string, StatsSessionState>;
}
