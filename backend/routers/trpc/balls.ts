import z from 'zod';
import { BallModel } from '#backend/db/models/BallModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcCrudOps';
import { Ball, BallCreate, BallUpdate } from '#shared/types/api/ball';

export const ballsRouter = router({
  ...createCrudOps({
    publicSchema: Ball,
    createSchema: BallCreate,
    updateSchema: BallUpdate,
    model: BallModel,
  }),

  search: leagueScopedProcedure
    .input(z.string())
    .output(Ball.array())
    .query(async ({ ctx, input }) => {
      const instances = runWithErrorConversion(() =>
        BallModel.search(ctx.db, ctx.league.uuid, input),
      );

      return await instances;
    }),
});
