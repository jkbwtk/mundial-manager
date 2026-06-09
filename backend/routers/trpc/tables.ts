import { TableModel } from '#backend/db/models/TableModel';
import { router } from '#blib/trpc';
import { createCrudOps, createSearchProcedure } from '#blib/trpcOps';
import {
  Table,
  TableCreate,
  TableQueryMeta,
  TableUpdate,
} from '#shared/types/api/table';

export const tablesRouter = router({
  ...createCrudOps({
    publicSchema: Table,
    createSchema: TableCreate,
    updateSchema: TableUpdate,
    model: TableModel,
    queryMetaSchema: TableQueryMeta,
  }),

  search: createSearchProcedure(Table, TableModel),
});
