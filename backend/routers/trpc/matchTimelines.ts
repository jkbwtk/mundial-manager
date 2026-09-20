import { MatchModel } from '#backend/db/models/MatchModel';
import { leagueScopedProcedure, router } from '#blib/trpc';
import {
  MatchTimeline,
  MatchTimelineByMatchId,
  MatchTimelineSave,
} from '#shared/types/api/matchTimeline';

export const matchTimelinesRouter = router({
  getByMatchId: leagueScopedProcedure
    .input(MatchTimelineByMatchId)
    .output(MatchTimeline)
    .query(async ({ ctx, input }) => {
      return MatchModel.getTimeline(ctx.db, ctx.league.uuid, input.matchUuid);
    }),

  saveByMatchId: leagueScopedProcedure
    .input(MatchTimelineSave)
    .output(MatchTimeline)
    .mutation(async ({ ctx, input }) => {
      return MatchModel.saveTimeline(ctx.db, ctx.league.uuid, input);
    }),
});
