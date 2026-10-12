import { procedure, router } from '#blib/trpc';
import { getGrantedPermissions } from '#shared/permissions';
import { Identity } from '#shared/types/api/identity';

export const systemRouter = router({
  ping: procedure.query(() => 'pong'),

  identity: procedure.output(Identity).query(async ({ ctx }) => {
    const jwt = await ctx.jwt;

    return {
      role: jwt?.role ?? null,
      permissions:
        jwt === null ? [] : getGrantedPermissions(jwt.role, !!jwt.leagueUuid),

      leagueUuid: jwt?.leagueUuid ?? null,
    };
  }),
});
