import { generalStatsModule } from '#shared/stats/generalStats';
import { playerStatsModule } from '#shared/stats/playerStats';
import { ratingStatsModule } from '#shared/stats/ratingStats';
import type {
  StatsModule,
  StatsModuleId,
} from '#shared/types/stats/statsModule';

export const statsModules = {
  GENERAL: generalStatsModule,
  PLAYERS: playerStatsModule,
  RATINGS: ratingStatsModule,
  // biome-ignore lint/suspicious/noExplicitAny: yeah
} as const satisfies Record<StatsModuleId, StatsModule<any>>;
