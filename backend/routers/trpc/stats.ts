import { StatsFrameModel } from '#backend/db/models/StatsFrameModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  GeneralStatsFramePaginated,
  GeneralStatsQuery,
  PlayerStatsFramePaginated,
  PlayerStatsQuery,
  RatingStatsFramePaginated,
  RatingStatsQuery,
} from '#shared/types/api/statsFrame';

export const statsRouter = router({
  getGeneral: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(GeneralStatsQuery)
    .output(GeneralStatsFramePaginated)
    .query(async ({ ctx, input }) => {
      return StatsFrameModel.getGeneral(ctx.db, ctx.league.uuid, input);
    }),

  getPlayers: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(PlayerStatsQuery)
    .output(PlayerStatsFramePaginated)
    .query(async ({ ctx, input }) => {
      return StatsFrameModel.getPlayers(ctx.db, ctx.league.uuid, input);
    }),

  getRatings: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(RatingStatsQuery)
    .output(RatingStatsFramePaginated)
    .query(async ({ ctx, input }) => {
      return StatsFrameModel.getRatings(ctx.db, ctx.league.uuid, input);
    }),
});
