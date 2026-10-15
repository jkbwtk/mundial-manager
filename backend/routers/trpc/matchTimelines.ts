import { MatchModel } from '#backend/db/models/MatchModel';
import { flushMatchSync } from '#blib/sheetSync';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  MatchTimeline,
  MatchTimelineByMatchId,
  MatchTimelineSave,
} from '#shared/types/api/matchTimeline';

export const matchTimelinesRouter = router({
  getByMatchId: leaguePermissionProcedure(PermissionEnum.MATCHES_READ)
    .input(MatchTimelineByMatchId)
    .output(MatchTimeline)
    .query(async ({ ctx, input }) => {
      return MatchModel.getTimeline(ctx.db, ctx.league.uuid, input.matchUuid);
    }),

  saveByMatchId: leaguePermissionProcedure(PermissionEnum.MATCHES_UPDATE)
    .input(MatchTimelineSave)
    .output(MatchTimeline)
    .mutation(async ({ ctx, input }) => {
      const timeline = await MatchModel.saveTimeline(
        ctx.db,
        ctx.league.uuid,
        input,
      );

      flushMatchSync(ctx.db, ctx.league.uuid, input.matchUuid);

      return timeline;
    }),
});
