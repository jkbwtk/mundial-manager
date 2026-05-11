import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { restrictedProcedure, router } from '#backend/trpc';

export const leagueRouter = router({
  activeLeague: restrictedProcedure.query(async ({ ctx }) => {
    if (ctx.jwt.leagueUuid === null) {
      return null;
    }

    const league = await LeagueModel.getById(ctx.db, ctx.jwt.leagueUuid);

    if (league === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'League not found',
      });
    }

    return league.serialize();
  }),
});
