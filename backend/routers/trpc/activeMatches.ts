import { ActiveMatchModel } from '#backend/db/models/ActiveMatchModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import { ActiveMatches } from '#shared/types/api/activeMatch';

export const activeMatchesRouter = router({
  getAll: leaguePermissionProcedure(PermissionEnum.MATCHES_READ)
    .output(ActiveMatches)
    .query(async ({ ctx }) => {
      return ActiveMatchModel.getAll(ctx.db, ctx.league.uuid);
    }),
});
