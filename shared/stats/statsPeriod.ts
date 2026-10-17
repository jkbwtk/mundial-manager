import { getStatsWeekKey } from '#shared/stats/buckets';
import type { StatsPeriod, StatsPeriodType } from '#shared/types/api/stats';
import type { StatsPeriodRows, StatsRow } from '#shared/types/stats/statsRow';

export function getStatsRowKey(
  row: StatsRow,
  type: StatsPeriodType,
): string | null {
  switch (type) {
    case 'MATCH':
      return row.match.uuid;
    case 'SESSION':
      return row.sessionKey;
    case 'DAY':
      return row.day;
    case 'WEEK':
      return row.day === null ? null : getStatsWeekKey(row.day);
    case 'MONTH':
      return row.day?.slice(0, 7) ?? null;
    case 'SEASON':
      return row.seasonKey;
  }
}

export function getStatsPeriodKeys(
  rows: StatsRow[],
  type: StatsPeriodType,
): string[] {
  return [...new Set(rows.flatMap((row) => getStatsRowKey(row, type) ?? []))];
}

export function getStatsPeriodRows(
  rows: StatsRow[],
  period: StatsPeriod | null,
): StatsPeriodRows | null {
  if (period === null) return { key: null, index: 0, count: 1, rows };

  const keys = getStatsPeriodKeys(rows, period.type);
  const key = period.key ?? keys.at(-1);
  const index = key === undefined ? -1 : keys.indexOf(key);

  if (key === undefined || index === -1) return null;

  return {
    key,
    index,
    count: keys.length,
    rows: rows.filter((row) => getStatsRowKey(row, period.type) === key),
  };
}
