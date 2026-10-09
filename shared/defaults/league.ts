import type { League, LeagueLink } from '#shared/types/api/league';
import type { DeepPartial } from '#shared/zod';

export const leagueCreateDefaults = {
  timezone: 'UTC',
} satisfies DeepPartial<League>;

export const leagueLinkQueryDefaults = {
  role: 'MEMBER',
  ttl: 365, // days
} satisfies DeepPartial<LeagueLink>;
