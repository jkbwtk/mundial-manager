import { BallModel } from '#backend/db/models/BallModel';
import { router } from '#blib/trpc';
import { createCrudOps, createSearchProcedure } from '#blib/trpcOps';
import {
  Ball,
  BallCreate,
  BallQueryMeta,
  BallUpdate,
} from '#shared/types/api/ball';

export const ballsRouter = router({
  ...createCrudOps({
    publicSchema: Ball,
    createSchema: BallCreate,
    updateSchema: BallUpdate,
    model: BallModel,
    queryMetaSchema: BallQueryMeta,
  }),

  search: createSearchProcedure(Ball, BallModel),
});
