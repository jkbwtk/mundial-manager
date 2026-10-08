import z from 'zod';
import { TimeZone } from '#shared/zod';

export const League = z.object({
  uuid: z.uuid(),

  name: z.string().trim().min(3).max(64),
  alias: z.string().trim().min(2).max(16),
  description: z.string().trim().max(255).nullish(),

  timezone: TimeZone,
});

export type League = z.infer<typeof League>;

export const LeagueCreate = League.omit({ uuid: true }).extend({
  timezone: League.shape.timezone.default('UTC'),
});
export type LeagueCreate = z.infer<typeof LeagueCreate>;
export type LeagueCreateInput = z.input<typeof LeagueCreate>;

export const LeagueUpdate = League.omit({ uuid: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type LeagueUpdate = z.infer<typeof LeagueUpdate>;
