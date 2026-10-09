import {
  defaultEloParams,
  defaultGlicko2Params,
} from '#shared/defaults/ratingSystem';
import type { SeasonConfig } from '#shared/types/api/season';

export const defaultSeasonConfig = {
  resetRatings: true,
  sessionGap: 15 * 60_000, // milliseconds

  ratings: {
    ELO: defaultEloParams,
    GLICKO2: defaultGlicko2Params,
  },
} satisfies SeasonConfig;
