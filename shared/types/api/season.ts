import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { defaultSeasonConfig } from '#shared/defaults/season';
import { Labels } from '#shared/labels';
import { RatingSystemsConfig } from '#shared/types/stats/ratingSystem';
import { PaginatedResponse, withDefaults } from '#shared/zod';

export const SeasonConfig = z.object({
  resetRatings: z.boolean(),
  sessionGap: z.number().nonnegative(), // milliseconds

  ratings: RatingSystemsConfig,
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

export const SeasonCreate = Season.omit({ uuid: true }).extend({
  config: withDefaults(SeasonConfig, defaultSeasonConfig),
});
export type SeasonCreate = z.infer<typeof SeasonCreate>;

export const SeasonUpdate = Season.omit({ uuid: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type SeasonUpdate = z.infer<typeof SeasonUpdate>;

export const SeasonQueryMeta = createQueryMeta({
  sortFields: ['name', 'startDate', 'endDate'] as const,
});
export type SeasonQueryMeta = z.infer<typeof SeasonQueryMeta>;
