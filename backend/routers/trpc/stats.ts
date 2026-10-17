import { StatsModel } from '#backend/db/models/StatsModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import { HeadToHead, HeadToHeadQuery } from '#shared/types/api/headToHead';
import {
  GeneralStatsSeries,
  GeneralStatsSeriesQuery,
  MatchPrediction,
  MatchPredictionQuery,
  PeriodMatch,
  PeriodMatchQuery,
  PeriodStats,
  PeriodStatsQuery,
  PlayerProfileStats,
  PlayerProfileStatsQuery,
  RatingHistory,
  RatingHistoryQuery,
  StatsPeriods,
  StatsPeriodsQuery,
  StatsVersion,
} from '#shared/types/api/stats';

export const statsRouter = router({
  getVersion: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .output(StatsVersion)
    .query(async ({ ctx }) => {
      return StatsModel.getVersion(ctx.db, ctx.league.uuid);
    }),

  getPeriods: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(StatsPeriodsQuery)
    .output(StatsPeriods)
    .query(async ({ ctx, input }) => {
      return StatsModel.getPeriods(ctx.db, ctx.league.uuid, input);
    }),

  getPeriodStats: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(PeriodStatsQuery)
    .output(PeriodStats)
    .query(async ({ ctx, input }) => {
      return StatsModel.getPeriodStats(ctx.db, ctx.league.uuid, input);
    }),

  getPeriodMatch: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(PeriodMatchQuery)
    .output(PeriodMatch.nullable())
    .query(async ({ ctx, input }) => {
      return StatsModel.getPeriodMatch(ctx.db, ctx.league.uuid, input);
    }),

  getPlayerProfileStats: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(PlayerProfileStatsQuery)
    .output(PlayerProfileStats)
    .query(async ({ ctx, input }) => {
      return StatsModel.getPlayerProfileStats(ctx.db, ctx.league.uuid, input);
    }),

  getHeadToHead: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(HeadToHeadQuery)
    .output(HeadToHead.array())
    .query(async ({ ctx, input }) => {
      return StatsModel.getHeadToHead(ctx.db, ctx.league.uuid, input);
    }),

  getMatchPrediction: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(MatchPredictionQuery)
    .output(MatchPrediction.nullable())
    .query(async ({ ctx, input }) => {
      return StatsModel.getMatchPrediction(ctx.db, ctx.league.uuid, input);
    }),

  getGeneralStatsSeries: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(GeneralStatsSeriesQuery)
    .output(GeneralStatsSeries)
    .query(async ({ ctx, input }) => {
      return StatsModel.getGeneralStatsSeries(ctx.db, ctx.league.uuid, input);
    }),

  getRatingHistory: leaguePermissionProcedure(PermissionEnum.STATS_READ)
    .input(RatingHistoryQuery)
    .output(RatingHistory)
    .query(async ({ ctx, input }) => {
      return StatsModel.getRatingHistory(ctx.db, ctx.league.uuid, input);
    }),
});
