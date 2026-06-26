import { MatchModel } from '#backend/db/models/MatchModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  MatchUpdate,
} from '#shared/types/api/match';
import { MatchFullCreate } from '#shared/types/api/matchFull';

export const matchesRouter = router({
  ...createCrudOps({
    publicSchema: Match,
    createSchema: MatchCreate,
    updateSchema: MatchUpdate,
    model: MatchModel,
    queryMetaSchema: MatchQueryMeta,
  }),

  createFullMatch: leagueScopedProcedure
    .input(MatchFullCreate)
    .output(Match)
    .mutation(async ({ ctx, input }) => {
      const instance = await runWithErrorConversion(() =>
        MatchModel.createFullMatch(ctx.db, ctx.league.uuid, input),
      );

      return instance;
    }),
});
