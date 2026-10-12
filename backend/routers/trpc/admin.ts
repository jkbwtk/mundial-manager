import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { environment } from '#backend/environment';
import { Pagination } from '#backend/types/trpc';
import { getJWTCookieOptions, sign } from '#blib/jwt';
import { createMagicLink } from '#blib/magicLink';
import { permissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  League,
  LeagueCreate,
  LeagueLinkQuery,
  LeagueUpdate,
} from '#shared/types/api/league';

export const adminRouter = router({
  leagues: permissionProcedure(PermissionEnum.LEAGUES_READ)
    .input(Pagination.optional())
    .query(async ({ ctx, input }) => {
      const count = LeagueModel.count(ctx.db);
      const leagues = LeagueModel.getAll(ctx.db, input?.limit, input?.offset);

      const [total, data] = await Promise.all([count, leagues]);

      return {
        data: data.map((l) => l.serialize()),
        total,
      };
    }),

  createLeague: permissionProcedure(PermissionEnum.LEAGUES_CREATE)
    .input(LeagueCreate)
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.create(ctx.db, input);

      return league.serialize();
    }),

  updateLeague: permissionProcedure(PermissionEnum.LEAGUES_UPDATE)
    .input(LeagueUpdate)
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.update(ctx.db, input);

      return league.serialize();
    }),

  deleteLeague: permissionProcedure(PermissionEnum.LEAGUES_DELETE)
    .input(League.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.delete(ctx.db, input.uuid);

      return league.serialize();
    }),

  changeLeague$: permissionProcedure(PermissionEnum.LEAGUES_SWITCH)
    .input(League.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.getById(ctx.db, input.uuid);

      if (league === null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      const newJWT = await sign({
        ...ctx.jwt,
        leagueUuid: league.instance.uuid,
      });

      ctx.cookies.set(
        environment.JWT_COOKIE_NAME,
        newJWT,
        getJWTCookieOptions(ctx.cookieSecurity, new Date(ctx.jwt.exp * 1000)),
      );

      return league.serialize();
    }),

  leagueLink: permissionProcedure(PermissionEnum.LEAGUES_INVITE)
    .input(LeagueLinkQuery)
    .query(async ({ ctx, input }) => {
      const league = await LeagueModel.getById(ctx.db, input.uuid);

      if (league === null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      const link = await createMagicLink(
        {
          uuid: randomUUID(),

          origin: 'admin-league-link',

          role: input.role,
          leagueUuid: league.instance.uuid,

          redirectTo: '/',
        },
        `${input.ttl} days`,
      );

      return { link };
    }),
});
