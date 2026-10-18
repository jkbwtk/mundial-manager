import type { RoutePreloadFuncArgs } from '@solidjs/router';
import {
  getRatingHistoryQuery,
  getStatsPeriod,
  parseStatsPeriodSearch,
} from '#flib/statsPeriod';
import { queryRatingHistory } from '#flib/trpcCalls';
import type { StatsPeriod } from '#shared/types/api/stats';

export function preloadRatingsPagePeriod(period: StatsPeriod) {
  queryRatingHistory(getRatingHistoryQuery(period));
}

export function preloadRatingsPage(args: RoutePreloadFuncArgs) {
  preloadRatingsPagePeriod(
    getStatsPeriod(parseStatsPeriodSearch(args.location.query)),
  );
}
