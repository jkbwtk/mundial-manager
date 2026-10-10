import z from 'zod';

export const StatsInvalidationSourceEnum = {
  LEAGUE: 'LEAGUE',
  SEASON: 'SEASON',
  MATCH: 'MATCH',
} as const;

export const StatsInvalidationSource = z.enum(StatsInvalidationSourceEnum);
export type StatsInvalidationSource = z.infer<typeof StatsInvalidationSource>;

export const StatsInvalidation = z.object({
  source: StatsInvalidationSource,
  uuid: z.uuid(),
});
export type StatsInvalidation = z.infer<typeof StatsInvalidation>;
