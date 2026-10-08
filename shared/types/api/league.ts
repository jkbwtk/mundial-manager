import z from 'zod';
import { Role, RoleEnum } from '#shared/permissions';
import { TimeZone } from '#shared/zod';

export const League = z.object({
  uuid: z.uuid(),

  name: z.string().trim().min(3).max(64),
  alias: z.string().trim().min(2).max(16),
  description: z.string().trim().max(255).nullish(),

  timezone: TimeZone,
});

export type League = z.infer<typeof League>;

export const LeagueNullable = League.nullable();
export type LeagueNullable = z.infer<typeof LeagueNullable>;

export const LeagueCreate = League.omit({ uuid: true }).extend({
  timezone: League.shape.timezone.default('UTC'),
});
export type LeagueCreate = z.infer<typeof LeagueCreate>;
export type LeagueCreateInput = z.input<typeof LeagueCreate>;

export const LeagueUpdate = League.omit({ uuid: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type LeagueUpdate = z.infer<typeof LeagueUpdate>;

export const LeagueSettingsUpdate = League.pick({
  name: true,
  description: true,
  timezone: true,
}).partial();
export type LeagueSettingsUpdate = z.infer<typeof LeagueSettingsUpdate>;

export const LeagueLinkRole = Role.exclude([RoleEnum.ADMIN]);
export type LeagueLinkRole = z.infer<typeof LeagueLinkRole>;

export const LeagueLinkQuery = League.pick({ uuid: true }).extend({
  role: LeagueLinkRole.default(RoleEnum.MEMBER),
  ttl: z.int().min(1).max(365).default(365), // days
});
export type LeagueLinkQuery = z.infer<typeof LeagueLinkQuery>;
export type LeagueLinkQueryInput = z.input<typeof LeagueLinkQuery>;
