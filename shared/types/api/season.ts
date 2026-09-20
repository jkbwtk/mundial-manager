import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Labels } from '#shared/labels';
import { PaginatedResponse } from '#shared/zod';

export const SeasonConfig = z.object({
  resetRatings: z.boolean(),

  defaultEloRating: z.number(),

  defaultGlicko2Rating: z.number(),
  defaultGlicko2RD: z.number(),
  defaultGlicko2Volatility: z.number(),

  eloKFactorRanges: z.record(z.string(), z.number()),

  eloScoreMultipliers: z.record(z.string(), z.number()),
});
export type SeasonConfig = z.infer<typeof SeasonConfig>;

export const Season = z.object({
  uuid: z.uuid(),
  name: z.string().max(255),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  config: SeasonConfig,
  labels: Labels,
});
export type Season = z.infer<typeof Season>;

export const SeasonPaginated = PaginatedResponse(Season);
export type SeasonPaginated = z.infer<typeof SeasonPaginated>;

export const SeasonNullable = Season.nullable();
export type SeasonNullable = z.infer<typeof SeasonNullable>;

export const SeasonCreate = Season.omit({ uuid: true });
export type SeasonCreate = z.infer<typeof SeasonCreate>;

export const SeasonUpdate = SeasonCreate.partial().extend({ uuid: z.uuid() });
export type SeasonUpdate = z.infer<typeof SeasonUpdate>;

export const SeasonQueryMeta = createQueryMeta({
  sortFields: ['name', 'startDate', 'endDate'] as const,
});
export type SeasonQueryMeta = z.infer<typeof SeasonQueryMeta>;
