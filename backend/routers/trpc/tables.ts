import { TableModel } from '#backend/db/models/TableModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcCrudOps';
import { Table, TableCreate, TableUpdate } from '#shared/types/api/table';

export const tablesRouter = router({
  ...createCrudOps({
    publicSchema: Table,
    createSchema: TableCreate,
    updateSchema: TableUpdate,
    model: TableModel,
  }),
});
