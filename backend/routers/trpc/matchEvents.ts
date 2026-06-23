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
import { PaginatedResponse } from '#shared/zod';

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
    .output(PaginatedResponse(MatchEvent))
    .query(async ({ ctx, input: { matchUuid, ...meta } }) => {
      const instances = await runWithErrorConversion(() =>
        MatchEventModel.getByMatchId(ctx.db, ctx.league.uuid, matchUuid, meta),
      );
      const total = runWithErrorConversion(() =>
        MatchEventModel.countByMatchId(ctx.db, ctx.league.uuid, matchUuid),
      );

      const mappedInstances = Promise.all(
        instances.map((instance) =>
          MatchEventModel.mapToPublic(ctx.db, instance),
        ),
      );

      return {
        data: await mappedInstances,
        total: await total,
      };
    }),
});
