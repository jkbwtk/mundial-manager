import { MatchSessionModel } from '#backend/db/models/MatchSessionModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  MatchSession,
  MatchSessionByMatchId,
  MatchSessionSpectatorsSave,
} from '#shared/types/api/matchSession';

export const matchSessionsRouter = router({
  getByMatchId: leaguePermissionProcedure([
    PermissionEnum.MATCHES_READ,
    PermissionEnum.PLAYERS_READ,
  ])
    .input(MatchSessionByMatchId)
    .output(MatchSession)
    .query(async ({ ctx, input }) => {
      return MatchSessionModel.getByMatchId(
        ctx.db,
        ctx.league.uuid,
        input.matchUuid,
      );
    }),

  saveSpectators: leaguePermissionProcedure(PermissionEnum.MATCHES_UPDATE)
    .input(MatchSessionSpectatorsSave)
    .output(MatchSession)
    .mutation(async ({ ctx, input }) => {
      return MatchSessionModel.saveSpectators(ctx.db, ctx.league.uuid, input);
    }),
});
