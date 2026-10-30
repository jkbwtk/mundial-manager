import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { PAGINATOR_DEFAULT_LIMIT } from '#components/Paginator';
import {
  readSearchParamsState,
  type SearchParamsStateOptions,
} from '#flib/searchParamsState';
import { queryPlayers } from '#flib/trpcCalls';
import { PlayerQueryMeta } from '#shared/types/api/player';

const PlayersDashboardQueryMeta = PlayerQueryMeta.required({
  pagination: true,
});

export const playersDashboardSearchState: SearchParamsStateOptions<
  typeof PlayersDashboardQueryMeta
> = {
  schema: PlayersDashboardQueryMeta,
  defaultState: {
    pagination: {
      limit: PAGINATOR_DEFAULT_LIMIT,
      offset: 0,
    },
  },
};

export function preloadPlayersDashboard(args: RoutePreloadFuncArgs) {
  queryPlayers(
    readSearchParamsState(args.location.query, playersDashboardSearchState),
  );
}
