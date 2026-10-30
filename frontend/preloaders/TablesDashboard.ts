import type { RoutePreloadFuncArgs } from '@solidjs/router';
import { PAGINATOR_DEFAULT_LIMIT } from '#components/Paginator';
import {
  readSearchParamsState,
  type SearchParamsStateOptions,
} from '#flib/searchParamsState';
import { queryTables } from '#flib/trpcCalls';
import { TableQueryMeta } from '#shared/types/api/table';

const TablesDashboardQueryMeta = TableQueryMeta.required({ pagination: true });

export const tablesDashboardSearchState: SearchParamsStateOptions<
  typeof TablesDashboardQueryMeta
> = {
  schema: TablesDashboardQueryMeta,
  defaultState: {
    pagination: {
      limit: PAGINATOR_DEFAULT_LIMIT,
      offset: 0,
    },
  },
};

export function preloadTablesDashboard(args: RoutePreloadFuncArgs) {
  queryTables(
    readSearchParamsState(args.location.query, tablesDashboardSearchState),
  );
}
