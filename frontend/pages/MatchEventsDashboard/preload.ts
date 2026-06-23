import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { queryMatchEventsByMatchId } from '#flib/trpcCalls';
import type { MatchEventsDashboardParams } from '#pages/MatchEventsDashboard';

export function preloadMatchEventsDashboard(args: RoutePreloadFuncArgs) {
  const matchUuid = (args.params as MatchEventsDashboardParams).matchUuid;

  queryMatchEventsByMatchId({
    matchUuid,
    sorting: {
      field: 'time',
      direction: 'asc',
    },
  });
}
