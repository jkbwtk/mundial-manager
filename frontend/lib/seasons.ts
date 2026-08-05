import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { isServer } from 'solid-js/web';
import type { Season } from '#frontend/types';

dayjs.extend(isBetween);

export const defaultSeason: Season = {
  number: 0,
  label: 'Pre-season',

  config: {
    resetRatings: true,

    defaultEloRating: 1500,
    defaultGlicko2Rating: 1500,
    defaultGlicko2RD: 350,
    defaultGlicko2Volatility: 0.06,

    eloKFactorRanges: {
      2100: 32,
      2400: 24,
      default: 16,
    },

    eloScoreMultipliers: {
      0: 1.0,
      1: 1.0,
      2: 1.1,
      3: 1.2,
      4: 1.3,
      5: 1.4,
      6: 1.5,
      7: 1.6,
      8: 1.7,
      9: 1.8,
      10: 2.0,
      default: 1,
    },
  },

  startDate: dayjs('1970-01-01').startOf('day'),
  endDate: dayjs('2025-12-21').endOf('day'),
};

if (isServer === false) {
  // @ts-expect-error
  globalThis.defaultSeasonConfig = structuredClone(defaultSeason.config);
}

export const seasons: Season[] = [
  {
    number: 1.1,
    label: 'Season 26Q1',

    config: structuredClone(defaultSeason.config),

    startDate: dayjs('2026-01-05').startOf('day'),
    endDate: dayjs('2026-03-15').endOf('day'),
  },
  {
    number: 1.2,
    label: 'Season 26Q2',

    config: structuredClone(defaultSeason.config),

    startDate: dayjs('2026-03-16').startOf('day'),
    endDate: dayjs('2026-05-24').endOf('day'),
  },
  {
    number: 1.3,
    label: 'Season 26Q3',

    config: structuredClone(defaultSeason.config),

    startDate: dayjs('2026-05-25').startOf('day'),
    endDate: dayjs('2026-08-02').endOf('day'),
  },
  {
    number: 1.4,
    label: 'Season 26Q4',

    config: {
      ...structuredClone(defaultSeason.config),

      eloKFactorRanges: {
        1600: 32,
        1700: 28,
        1800: 24,
        1900: 20,
        default: 16,
      },

      eloScoreMultipliers: {
        0: 1.0,
        1: 1.0,
        2: 1.1,
        3: 1.2,
        4: 1.3,
        5: 1.4,
        6: 1.5,
        7: 1.6,
        8: 1.7,
        9: 1.8,
        10: 4.0,
        default: 1,
      },
    },

    startDate: dayjs('2026-08-03').startOf('day'),
    endDate: dayjs('2026-10-11').endOf('day'),
  },
  {
    number: 1.5,
    label: 'Season 26Q5',
    config: structuredClone(defaultSeason.config),

    startDate: dayjs('2026-10-12').startOf('day'),
    endDate: dayjs('2026-12-20').endOf('day'),
  },
  {
    number: 1.6,
    label: 'Off-season 26',

    config: structuredClone(defaultSeason.config),

    startDate: dayjs('2026-12-21').startOf('day'),
    endDate: dayjs('2027-01-03').endOf('day'),
  },
];

// @ts-expect-error
globalThis.seasonConfigOverride = null;

export function getSeason(dateUnix: number | null): Season {
  if (dateUnix === null) {
    return defaultSeason;
  }

  const date = dayjs.unix(dateUnix);

  for (const season of seasons) {
    if (date.isBetween(season.startDate, season.endDate, null, '[]')) {
      return {
        ...season,
        // @ts-expect-error
        config: globalThis.seasonConfigOverride ?? season.config,
      };
    }
  }

  return defaultSeason;
}
