import {
  defaultEloParams,
  defaultGlicko2Params,
} from '#shared/defaults/ratingSystem';
import type {
  MatchRules,
  SeasonConfig,
  StylePointsConfig,
} from '#shared/types/api/season';

export const defaultMatchRules = {
  target: 10,
  winByTwo: true,
} satisfies MatchRules;

export const defaultStylePointsConfig = {
  streaks: { '3': 20, '4': 40, '5': 80 },
  comebacks: { '3': 50, '5': 100, '7': 200 },
} satisfies StylePointsConfig;

export const defaultSeasonConfig = {
  resetRatings: true,
  sessionGap: 15 * 60_000, // milliseconds

  rules: defaultMatchRules,
  stylePoints: defaultStylePointsConfig,
  goalTypes: {},

  ratings: {
    ELO: defaultEloParams,
    GLICKO2: defaultGlicko2Params,
  },
} satisfies SeasonConfig;
