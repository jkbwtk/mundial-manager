import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { PAGINATOR_DEFAULT_LIMIT } from '#components/Paginator';
import {
  readSearchParamsState,
  type SearchParamsStateOptions,
} from '#flib/searchParamsState';
import {
  queryActiveLeague,
  queryActiveMatches,
  queryMatches,
  queryPlayers,
  queryTables,
} from '#flib/trpcCalls';
import { MatchQueryMeta } from '#shared/types/api/match';

const MatchesDashboardQueryMeta = MatchQueryMeta.required({ pagination: true });

export const matchesDashboardSearchState: SearchParamsStateOptions<
  typeof MatchesDashboardQueryMeta
> = {
  schema: MatchesDashboardQueryMeta,
  defaultState: {
    pagination: {
      limit: PAGINATOR_DEFAULT_LIMIT,
      offset: 0,
    },
    sorting: {
      direction: 'desc',
      field: 'startDate',
    },
  },
};

export function preloadMatchesDashboard(args: RoutePreloadFuncArgs) {
  queryMatches(
    readSearchParamsState(args.location.query, matchesDashboardSearchState),
  );
  queryActiveLeague();
  queryActiveMatches();
  queryPlayers();
  queryTables();
}
