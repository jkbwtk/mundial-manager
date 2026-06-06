import { BallModel } from '#backend/db/models/BallModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcCrudOps';
import { Ball, BallCreate, BallUpdate } from '#shared/types/api/ball';

export const ballsRouter = router({
  ...createCrudOps({
    publicSchema: Ball,
    createSchema: BallCreate,
    updateSchema: BallUpdate,
    model: BallModel,
  }),
});
