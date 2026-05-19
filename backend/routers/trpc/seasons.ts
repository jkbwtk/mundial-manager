import { TRPCError } from '@trpc/server';
import z from 'zod';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { Season, SeasonCreate, SeasonUpdate } from '#shared/types/api/season';

export const seasonsRouter = router({
  seasons: leagueScopedProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const seasons = runWithErrorConversion(() =>
        SeasonModel.getAll(
          ctx.db,
          ctx.league.uuid,
          input?.limit,
          input?.offset,
        ),
      );
      const total = runWithErrorConversion(() =>
        SeasonModel.count(ctx.db, ctx.league.uuid),
      );

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
      const season = await runWithErrorConversion(() =>
        SeasonModel.getById(ctx.db, ctx.league.uuid, input.uuid),
      );

      if (!season) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Season not found',
        });
      }

      return season.serialize();
    }),

  seasonByDate: leagueScopedProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(async ({ ctx, input }) => {
      const season = await runWithErrorConversion(() =>
        SeasonModel.getByDate(ctx.db, ctx.league.uuid, input.date),
      );

      return season?.serialize() ?? null;
    }),
});
