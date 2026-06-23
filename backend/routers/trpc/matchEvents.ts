import z from 'zod';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import {
  MatchEvent,
  MatchEventByMatchId,
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
    .input(MatchEventByMatchId)
    .output(z.array(MatchEvent))
    .query(async ({ ctx, input: { matchUuid, ...meta } }) => {
      const instances = await runWithErrorConversion(() =>
        MatchEventModel.getByMatchId(ctx.db, ctx.league.uuid, matchUuid, meta),
      );

      return await Promise.all(
        instances.map((instance) =>
          MatchEventModel.mapToPublic(ctx.db, instance),
        ),
      );
    }),
});
