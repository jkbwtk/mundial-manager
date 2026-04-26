import z from 'zod';

export const League = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  description: z.string().nullable().default(null),
});

export type League = z.infer<typeof League>;

export const LeagueCreate = League.omit({ uuid: true });
export type LeagueCreate = z.infer<typeof LeagueCreate>;

export const LeagueUpdate = LeagueCreate.partial();
export type LeagueUpdate = z.infer<typeof LeagueUpdate>;
