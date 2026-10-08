import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import {
  leaguePermissionProcedure,
  restrictedProcedure,
  router,
} from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import { League, LeagueSettingsUpdate } from '#shared/types/api/league';

export const leaguesRouter = router({
  activeLeague: restrictedProcedure.query(async ({ ctx }) => {
    const leagueUuid = ctx.jwt.leagueUuid;

    if (leagueUuid === null) {
      return null;
    }

    const league = await LeagueModel.getById(ctx.db, leagueUuid);

    if (league === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'League not found',
      });
    }

    return league.serialize();
  }),

  updateActive: leaguePermissionProcedure(PermissionEnum.LEAGUE_SETTINGS_UPDATE)
    .input(LeagueSettingsUpdate)
    .output(League)
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.update(ctx.db, {
        ...input,
        uuid: ctx.league.instance.uuid,
      });

      return league.serialize();
    }),
});
