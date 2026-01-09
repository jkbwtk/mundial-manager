import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import type { Season } from '#frontend/types';

dayjs.extend(isBetween);

export const defaultSeason: Season = {
  number: 0,
  startDate: dayjs('1970-01-01').startOf('day'),
  endDate: dayjs('2025-12-21').endOf('day'),
  label: 'Pre-season',
};

export const seasons: Season[] = [
  {
    number: 1.1,
    label: 'Season 26Q1',
    startDate: dayjs('2026-01-05').startOf('day'),
    endDate: dayjs('2026-03-15').endOf('day'),
  },
  {
    number: 1.2,
    label: 'Season 26Q2',
    startDate: dayjs('2026-03-16').startOf('day'),
    endDate: dayjs('2026-05-24').endOf('day'),
  },
  {
    number: 1.3,
    label: 'Season 26Q3',
    startDate: dayjs('2026-05-25').startOf('day'),
    endDate: dayjs('2026-08-02').endOf('day'),
  },
  {
    number: 1.4,
    label: 'Season 26Q4',
    startDate: dayjs('2026-08-03').startOf('day'),
    endDate: dayjs('2026-10-11').endOf('day'),
  },
  {
    number: 1.5,
    label: 'Season 26Q5',
    startDate: dayjs('2026-10-12').startOf('day'),
    endDate: dayjs('2026-12-20').endOf('day'),
  },
  {
    number: 1.6,
    label: 'Off-season 26',
    startDate: dayjs('2026-12-21').startOf('day'),
    endDate: dayjs('2027-01-03').endOf('day'),
  },
];

export function getSeason(dateUnix: number | null): Season {
  if (dateUnix === null) {
    return defaultSeason;
  }

  const date = dayjs.unix(dateUnix);

  for (const season of seasons) {
    if (date.isBetween(season.startDate, season.endDate, null, '[]')) {
      return season;
    }
  }

  return defaultSeason;
}
