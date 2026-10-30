import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { PAGINATOR_DEFAULT_LIMIT } from '#components/Paginator';
import {
  readSearchParamsState,
  type SearchParamsStateOptions,
} from '#flib/searchParamsState';
import {
  queryActiveLeague,
  queryCurrentSeason,
  querySeasons,
} from '#flib/trpcCalls';
import { SeasonQueryMeta } from '#shared/types/api/season';

const SeasonsDashboardQueryMeta = SeasonQueryMeta.required({
  pagination: true,
});

export const seasonsDashboardSearchState: SearchParamsStateOptions<
  typeof SeasonsDashboardQueryMeta
> = {
  schema: SeasonsDashboardQueryMeta,
  defaultState: {
    pagination: {
      limit: PAGINATOR_DEFAULT_LIMIT,
      offset: 0,
    },
    sorting: {
      direction: 'asc',
      field: 'startDate',
    },
  },
};

export function preloadSeasonsDashboard(args: RoutePreloadFuncArgs) {
  querySeasons(
    readSearchParamsState(args.location.query, seasonsDashboardSearchState),
  );
  queryCurrentSeason();
  queryActiveLeague();
}
