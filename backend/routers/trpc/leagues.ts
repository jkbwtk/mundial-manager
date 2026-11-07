import { LeagueModel } from '#backend/db/models/LeagueModel';
import {
  leaguePermissionProcedure,
  restrictedProcedure,
  router,
} from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  League,
  LeagueNullable,
  LeagueSettingsUpdate,
} from '#shared/types/api/league';

export const leaguesRouter = router({
  activeLeague: restrictedProcedure
    .output(LeagueNullable)
    .query(async ({ ctx }) => {
      const leagueUuid = ctx.jwt.leagueUuid;

      if (leagueUuid === null) {
        return null;
      }

      return LeagueModel.getByIdOrThrow(ctx.db, leagueUuid);
    }),

  updateActive: leaguePermissionProcedure(PermissionEnum.LEAGUE_SETTINGS_UPDATE)
    .input(LeagueSettingsUpdate)
    .output(League)
    .mutation(async ({ ctx, input }) => {
      return LeagueModel.update(ctx.db, {
        ...input,
        uuid: ctx.league.uuid,
      });
    }),
});
