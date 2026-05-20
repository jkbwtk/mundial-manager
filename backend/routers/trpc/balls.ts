import { TRPCError } from '@trpc/server';
import { BallModel } from '#backend/db/models/BallModel';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Ball, BallCreate, BallUpdate } from '#shared/types/api/ball';

export const ballsRouter = router({
  balls: leagueScopedProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const balls = runWithErrorConversion(() =>
        BallModel.getAll(ctx.db, ctx.league.uuid, input?.limit, input?.offset),
      );
      const total = runWithErrorConversion(() =>
        BallModel.count(ctx.db, ctx.league.uuid),
      );

      return {
        data: (await balls).map((t) => t.serialize()),
        total: await total,
      };
    }),

  createBall: leagueScopedProcedure
    .input(BallCreate)
    .mutation(async ({ ctx, input }) => {
      const ball = await runWithErrorConversion(() =>
        BallModel.create(ctx.db, ctx.league.uuid, input),
      );

      return ball.serialize();
    }),

  updateBall: leagueScopedProcedure
    .input(BallUpdate)
    .mutation(async ({ ctx, input }) => {
      const ball = await runWithErrorConversion(() =>
        BallModel.update(ctx.db, ctx.league.uuid, input),
      );

      return ball.serialize();
    }),

  deleteBall: leagueScopedProcedure
    .input(Ball.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const ball = await runWithErrorConversion(() =>
        BallModel.delete(ctx.db, ctx.league.uuid, input.uuid),
      );

      return ball.serialize();
    }),

  ballById: leagueScopedProcedure
    .input(Ball.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const ball = await runWithErrorConversion(() =>
        BallModel.getById(ctx.db, input.uuid),
      );

      if (!ball) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ball not found',
        });
      }

      return ball.serialize();
    }),
});
