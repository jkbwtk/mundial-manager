import z from 'zod';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import {
  MatchEvent,
  MatchEventCreate,
  MatchEventQueryMeta,
  MatchEventUpdate,
} from '#shared/types/api/matchEvent';

export const matchEventsRouter = router({
  ...createCrudOps({
    publicSchema: MatchEvent,
    createSchema: MatchEventCreate,
    updateSchema: MatchEventUpdate,
    model: MatchEventModel,
    queryMetaSchema: MatchEventQueryMeta,
  }),

  getByMatchId: leagueScopedProcedure
    .input(
      z.object({
        matchUuid: z.uuid(),
      }),
    )
    .output(z.array(MatchEvent))
    .query(async ({ ctx, input }) => {
      const instances = await runWithErrorConversion(() =>
        MatchEventModel.getByMatchId(ctx.db, ctx.league.uuid, input.matchUuid),
      );

      return await Promise.all(
        instances.map((instance) =>
          MatchEventModel.mapToPublic(ctx.db, instance),
        ),
      );
    }),
});
