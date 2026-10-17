import type {
  EloParams,
  Glicko2Params,
  SkillParams,
} from '#shared/types/stats/ratingSystem';

export const defaultEloParams = {
  enabled: true,

  defaultRating: 1500,

  kFactorRanges: {
    '2100': 32,
    '2400': 24,
    default: 16,
  },
  scoreMultipliers: {
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
} satisfies EloParams;

export const defaultGlicko2Params = {
  enabled: true,

  defaultRating: 1500,
  defaultRd: 350,
  defaultVolatility: 0.06,

  tau: 0.5,
} satisfies Glicko2Params;

export const defaultSkillParams = {
  enabled: true,

  defaultRating: 1500,
  defaultRd: 100,

  driftPerDay: 3,
  goalWeight: 0.3,
  extraPlayerAdvantage: 75,

  tolerance: 0.0001,
  maxSweeps: 50,

  conservativeDeviations: 2,
} satisfies SkillParams;
