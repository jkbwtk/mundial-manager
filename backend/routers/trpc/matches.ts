import { TRPCError } from '@trpc/server';
import { MatchModel } from '#backend/db/models/MatchModel';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Match, MatchCreate, MatchUpdate } from '#shared/types/api/match';

export const matchesRouter = router({
  getAll: leagueScopedProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const instances = runWithErrorConversion(() =>
        MatchModel.getAll(ctx.db, ctx.league.uuid, input?.limit, input?.offset),
      );
      const total = runWithErrorConversion(() =>
        MatchModel.count(ctx.db, ctx.league.uuid),
      );

      return {
        data: (await instances).map((t) => t.serialize()),
        total: await total,
      };
    }),

  getById: leagueScopedProcedure
    .input(Match.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        MatchModel.getById(ctx.db, input.uuid),
      );

      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Match not found',
        });
      }

      return instance.serialize();
    }),

  create: leagueScopedProcedure
    .input(MatchCreate)
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        MatchModel.create(ctx.db, ctx.league.uuid, input),
      );

      return instance.serialize();
    }),

  update: leagueScopedProcedure
    .input(MatchUpdate)
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        MatchModel.update(ctx.db, ctx.league.uuid, input),
      );

      return instance.serialize();
    }),

  delete: leagueScopedProcedure
    .input(Match.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        MatchModel.delete(ctx.db, ctx.league.uuid, input.uuid),
      );

      return instance.serialize();
    }),
});
