import { TRPCError } from '@trpc/server';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Player, PlayerCreate, PlayerUpdate } from '#shared/types/api/player';

export const playersRouter = router({
  getAll: leagueScopedProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const instances = runWithErrorConversion(() =>
        PlayerModel.getAll(
          ctx.db,
          ctx.league.uuid,
          input?.limit,
          input?.offset,
        ),
      );
      const total = runWithErrorConversion(() =>
        PlayerModel.count(ctx.db, ctx.league.uuid),
      );

      return {
        data: (await instances).map((t) => t.serialize()),
        total: await total,
      };
    }),

  getById: leagueScopedProcedure
    .input(Player.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        PlayerModel.getById(ctx.db, input.uuid),
      );

      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Player not found',
        });
      }

      return instance.serialize();
    }),

  create: leagueScopedProcedure
    .input(PlayerCreate)
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        PlayerModel.create(ctx.db, ctx.league.uuid, input),
      );

      return instance.serialize();
    }),

  update: leagueScopedProcedure
    .input(PlayerUpdate)
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        PlayerModel.update(ctx.db, ctx.league.uuid, input),
      );

      return instance.serialize();
    }),

  delete: leagueScopedProcedure
    .input(Player.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        PlayerModel.delete(ctx.db, ctx.league.uuid, input.uuid),
      );

      return instance.serialize();
    }),
});
