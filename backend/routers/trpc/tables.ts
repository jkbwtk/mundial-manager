import z from 'zod';
import { TableModel } from '#backend/db/models/TableModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcCrudOps';
import { Table, TableCreate, TableUpdate } from '#shared/types/api/table';

export const tablesRouter = router({
  ...createCrudOps({
    publicSchema: Table,
    createSchema: TableCreate,
    updateSchema: TableUpdate,
    model: TableModel,
  }),

  search: leagueScopedProcedure
    .input(z.string())
    .output(Table.array())
    .query(async ({ ctx, input }) => {
      const instances = runWithErrorConversion(() =>
        TableModel.search(ctx.db, ctx.league.uuid, input),
      );

      return await instances;
    }),
});
