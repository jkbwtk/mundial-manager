import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { getStatsPeriod, parseStatsPeriodSearch } from '#flib/statsPeriod';
import {
  queryActiveLeague,
  queryPeriodStats,
  queryPlayers,
  querySeasons,
  queryStatsPeriods,
  queryStatsVersion,
} from '#flib/trpcCalls';

export function preloadHomeLayout(args: RoutePreloadFuncArgs) {
  const period = getStatsPeriod(parseStatsPeriodSearch(args.location.query));

  queryActiveLeague();
  queryStatsVersion();
  queryPlayers();
  querySeasons();

  queryPeriodStats(period);
  queryStatsPeriods(period.type);
}
