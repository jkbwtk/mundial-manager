import type { RoutePreloadFuncArgs } from '@solidjs/router';
import {
  getPeriodMatchQuery,
  getStatsPeriod,
  parseStatsPeriodSearch,
} from '#flib/statsPeriod';
import {
  queryBalls,
  queryGoalTypes,
  queryPeriodMatch,
  queryPeriodStats,
  queryTables,
} from '#flib/trpcCalls';
import type { StatsPeriod } from '#shared/types/api/stats';

export function preloadHomepagePeriod(period: StatsPeriod) {
  queryPeriodStats(period);
  queryPeriodMatch(getPeriodMatchQuery(period));
}

export function preloadHomepage(args: RoutePreloadFuncArgs) {
  queryGoalTypes();
  queryTables();
  queryBalls();
  queryPeriodStats(null);

  preloadHomepagePeriod(
    getStatsPeriod(parseStatsPeriodSearch(args.location.query)),
  );
}
