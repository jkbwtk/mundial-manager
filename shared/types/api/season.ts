import z from 'zod';

export const SeasonConfig = z.object({});
export type SeasonConfig = z.infer<typeof SeasonConfig>;

export const Season = z.object({
  uuid: z.uuid(),
  name: z.string().max(255),
  startDate: z.date(),
  endDate: z.date(),
  config: SeasonConfig,
  labels: z.array(z.string()).default([]),
});
export type Season = z.infer<typeof Season>;

export const SeasonCreate = Season.omit({ uuid: true });
export type SeasonCreate = z.infer<typeof SeasonCreate>;

export const SeasonUpdate = SeasonCreate.partial().extend({ uuid: z.uuid() });
export type SeasonUpdate = z.infer<typeof SeasonUpdate>;
