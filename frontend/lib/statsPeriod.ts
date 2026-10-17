import z from 'zod';
import {
  type PeriodMatchQuery,
  type RatingHistoryQuery,
  type StatsPeriod,
  StatsPeriodType,
} from '#shared/types/api/stats';

export const StatsPeriodSearch = z.object({
  period: StatsPeriodType,
  at: z.string(),
});
export type StatsPeriodSearch = z.infer<typeof StatsPeriodSearch>;

export const defaultStatsPeriodSearch: StatsPeriodSearch = {
  period: 'DAY',
  at: '',
};

export function parseStatsPeriodSearch(
  query: Partial<Record<string, string | string[]>>,
): StatsPeriodSearch {
  const search = StatsPeriodSearch.safeParse({
    period: query.period,
    at: query.at ?? '',
  });

  return search.success ? search.data : defaultStatsPeriodSearch;
}

export function getStatsPeriod(search: StatsPeriodSearch): StatsPeriod {
  return search.at === ''
    ? { type: search.period }
    : { type: search.period, key: search.at };
}

export function getPeriodMatchQuery(
  period: StatsPeriod,
  offset = 0,
): PeriodMatchQuery {
  return { period, offset };
}

export function getRatingHistoryQuery(period: StatsPeriod): RatingHistoryQuery {
  return { period };
}
