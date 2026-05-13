import { TRPCError } from '@trpc/server';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { leagueScopedProcedure, router } from '#backend/trpc';
import { Season, SeasonCreate } from '#shared/types/api/season';

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
      const season = await SeasonModel.create(ctx.db, ctx.league.uuid, input);

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
