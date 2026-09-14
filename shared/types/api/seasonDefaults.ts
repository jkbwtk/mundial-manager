import type { SeasonConfig } from '#shared/types/api/season';

export const defaultSeasonConfig: SeasonConfig = {
  resetRatings: true,

  defaultEloRating: 1500,

  defaultGlicko2Rating: 1500,
  defaultGlicko2RD: 350,
  defaultGlicko2Volatility: 0.06,

  eloKFactorRanges: {
    '2100': 32,
    '2400': 24,
    default: 16,
  },

  eloScoreMultipliers: {
    '0': 1.0,
    '1': 1.0,
    '2': 1.1,
    '3': 1.2,
    '4': 1.3,
    '5': 1.4,
    '6': 1.5,
    '7': 1.6,
    '8': 1.7,
    '9': 1.8,
    '10': 2.0,
    default: 1,
  },
};
