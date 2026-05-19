import { TRPCError } from '@trpc/server';
import { TableModel } from '#backend/db/models/TableModel';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Table, TableCreate, TableUpdate } from '#shared/types/api/table';

export const tablesRouter = router({
  tables: leagueScopedProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const tables = runWithErrorConversion(() =>
        TableModel.getAll(ctx.db, ctx.league.uuid, input?.limit, input?.offset),
      );
      const total = runWithErrorConversion(() =>
        TableModel.count(ctx.db, ctx.league.uuid),
      );

      return {
        data: (await tables).map((t) => t.serialize()),
        total: await total,
      };
    }),

  createTable: leagueScopedProcedure
    .input(TableCreate)
    .mutation(async ({ ctx, input }) => {
      const table = await runWithErrorConversion(() =>
        TableModel.create(ctx.db, ctx.league.uuid, input),
      );

      return table.serialize();
    }),

  updateTable: leagueScopedProcedure
    .input(TableUpdate)
    .mutation(async ({ ctx, input }) => {
      const table = await runWithErrorConversion(() =>
        TableModel.update(ctx.db, ctx.league.uuid, input),
      );

      return table.serialize();
    }),

  deleteTable: leagueScopedProcedure
    .input(Table.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const table = await runWithErrorConversion(() =>
        TableModel.delete(ctx.db, ctx.league.uuid, input.uuid),
      );

      return table.serialize();
    }),

  tableById: leagueScopedProcedure
    .input(Table.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const table = await runWithErrorConversion(() =>
        TableModel.getById(ctx.db, input.uuid),
      );

      if (!table) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Table not found',
        });
      }

      return table.serialize();
    }),
});
