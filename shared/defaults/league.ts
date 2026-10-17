import { defaultSeasonConfig } from '#shared/defaults/season';
import { DAY_MS } from '#shared/timeUtils';
import type { League, LeagueLink } from '#shared/types/api/league';
import type { DeepPartial } from '#shared/zod';

export const leagueCreateDefaults = {
  timezone: 'UTC',
  seasonConfig: defaultSeasonConfig,
} satisfies DeepPartial<League>;

export const leagueLinkQueryDefaults = {
  role: 'MEMBER',
  ttl: 365 * DAY_MS, // milliseconds
} satisfies DeepPartial<LeagueLink>;
