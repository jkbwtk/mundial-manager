import z from 'zod';
import type { Match } from '#shared/types/api/match';
import type { Season } from '#shared/types/api/season';

export const StatsBucketEnum = {
  SESSION: 'SESSION',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  SEASON: 'SEASON',
  ALL: 'ALL',
} as const;

export const StatsBucket = z.enum(StatsBucketEnum);
export type StatsBucket = z.infer<typeof StatsBucket>;

export const StatsBuckets = Object.values(StatsBucketEnum);

export type StatsBucketKeys = Partial<Record<StatsBucket, string>>;

export type StatsSeason = Pick<
  Season,
  'uuid' | 'startDate' | 'endDate' | 'config'
>;

export type StatsBucketMatch = Pick<
  Match,
  'uuid' | 'tableUuid' | 'startDate' | 'duration' | 'pauseDuration' | 'labels'
>;

export const StatsSessionState = z.object({
  key: z.string(),

  matchEnd: z.number(), // epoch milliseconds
  players: z.record(z.uuid(), z.number()), // epoch milliseconds
});
export type StatsSessionState = z.infer<typeof StatsSessionState>;

export interface StatsBucketContext {
  timeZone: string;
  season: StatsSeason | null;

  previous: StatsBucketKeys;
  sessions: Record<string, StatsSessionState>;
}
