import {
  queryBalls,
  queryGeneralStatsSeries,
  queryPeriodStats,
  queryTables,
} from '#flib/trpcCalls';

export function preloadChartsPage() {
  queryTables();
  queryBalls();
  queryPeriodStats(null);
  queryGeneralStatsSeries({
    type: 'DAY',
    fields: ['matches', 'playtime', '_matchesWithDuration'],
  });
}
