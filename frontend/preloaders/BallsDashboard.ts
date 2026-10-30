import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { PAGINATOR_DEFAULT_LIMIT } from '#components/Paginator';
import {
  readSearchParamsState,
  type SearchParamsStateOptions,
} from '#flib/searchParamsState';
import { queryBalls } from '#flib/trpcCalls';
import { BallQueryMeta } from '#shared/types/api/ball';

const BallsDashboardQueryMeta = BallQueryMeta.required({ pagination: true });

export const ballsDashboardSearchState: SearchParamsStateOptions<
  typeof BallsDashboardQueryMeta
> = {
  schema: BallsDashboardQueryMeta,
  defaultState: {
    pagination: {
      limit: PAGINATOR_DEFAULT_LIMIT,
      offset: 0,
    },
  },
};

export function preloadBallsDashboard(args: RoutePreloadFuncArgs) {
  queryBalls(
    readSearchParamsState(args.location.query, ballsDashboardSearchState),
  );
}
