import { TRPCError } from '@trpc/server';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Season, SeasonCreate, SeasonUpdate } from '#shared/types/api/season';

export const seasonsRouter = router({
  seasons: leagueScopedProcedure.query(async ({ ctx }) => {
    const seasons = SeasonModel.getAll(ctx.db, ctx.league.uuid);
    const total = SeasonModel.count(ctx.db, ctx.league.uuid);

    return {
      data: (await seasons).map((s) => s.serialize()),
      total: await total,
    };
  }),

  createSeason: leagueScopedProcedure
    .input(SeasonCreate)
    .mutation(async ({ ctx, input }) => {
      const season = await runWithErrorConversion(() =>
        SeasonModel.create(ctx.db, ctx.league.uuid, input),
      );

      return season.serialize();
    }),

  updateSeason: leagueScopedProcedure
    .input(SeasonUpdate)
    .mutation(async ({ ctx, input }) => {
      const season = await runWithErrorConversion(() =>
        SeasonModel.update(ctx.db, ctx.league.uuid, input),
      );

      return season.serialize();
    }),

  deleteSeason: leagueScopedProcedure
    .input(Season.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const season = await runWithErrorConversion(() =>
        SeasonModel.delete(ctx.db, ctx.league.uuid, input.uuid),
      );

      return season.serialize();
    }),

  seasonById: leagueScopedProcedure
    .input(Season.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const season = await SeasonModel.getById(ctx.db, input.uuid);

      if (!season) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Season not found',
        });
      }

      return season.serialize();
    }),

  currentSeason: leagueScopedProcedure.query(async ({ ctx }) => {
    const season = await SeasonModel.getCurrent(ctx.db, ctx.league.uuid);

    return season?.serialize() ?? null;
  }),
});
