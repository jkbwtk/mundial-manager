import { MatchModel } from '#backend/db/models/MatchModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcCrudOps';
import { Match, MatchCreate, MatchUpdate } from '#shared/types/api/match';

export const matchesRouter = router({
  ...createCrudOps({
    publicSchema: Match,
    createSchema: MatchCreate,
    updateSchema: MatchUpdate,
    model: MatchModel,
  }),
});
