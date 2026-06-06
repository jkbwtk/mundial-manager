import z from 'zod';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import {
  Season,
  SeasonCreate,
  SeasonNullable,
  SeasonUpdate,
} from '#shared/types/api/season';

export const seasonsRouter = router({
  ...createCrudOps({
    publicSchema: Season,
    createSchema: SeasonCreate,
    updateSchema: SeasonUpdate,
    model: SeasonModel,
  }),

  seasonByDate: leagueScopedProcedure
    .input(z.object({ date: z.coerce.date() }))
    .output(SeasonNullable)
    .query(async ({ ctx, input }) => {
      const season = await runWithErrorConversion(() =>
        SeasonModel.getByDate(ctx.db, ctx.league.uuid, input.date),
      );

      return season;
    }),
});
