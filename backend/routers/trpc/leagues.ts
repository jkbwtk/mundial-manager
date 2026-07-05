import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { restrictedProcedure, router } from '#blib/trpc';

export const leaguesRouter = router({
  activeLeague: restrictedProcedure.query(async ({ ctx }) => {
    const leagueUuid = ctx.jwt.leagueUuid;

    if (leagueUuid === null) {
      return null;
    }

    const league = await runWithErrorConversion(() =>
      LeagueModel.getById(ctx.db, leagueUuid),
    );

    if (league === null) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'League not found',
      });
    }

    return league.serialize();
  }),
});
