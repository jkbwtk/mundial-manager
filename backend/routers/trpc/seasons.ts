import z from 'zod';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import {
  Season,
  SeasonCreate,
  SeasonNullable,
  SeasonQueryMeta,
  SeasonUpdate,
} from '#shared/types/api/season';

export const seasonsRouter = router({
  ...createCrudOps({
    publicSchema: Season,
    createSchema: SeasonCreate,
    updateSchema: SeasonUpdate,
    model: SeasonModel,
    queryMetaSchema: SeasonQueryMeta,
  }),

  seasonByDate: leagueScopedProcedure
    .input(z.object({ date: z.coerce.date() }))
    .output(SeasonNullable)
    .query(async ({ ctx, input }) => {
      return SeasonModel.getByDate(ctx.db, ctx.league.uuid, input.date);
    }),
});
