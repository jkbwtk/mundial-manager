import { randomUUID } from 'node:crypto';
import z from 'zod';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { environment } from '#backend/environment';
import { getJWTCookieOptions, sign } from '#blib/jwt';
import { createMagicLink } from '#blib/magicLink';
import { permissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  League,
  LeagueCreate,
  LeagueLinkQuery,
  LeaguePaginated,
  LeagueUpdate,
} from '#shared/types/api/league';
import { Pagination } from '#shared/types/api/queryMeta';

export const adminRouter = router({
  leagues: permissionProcedure(PermissionEnum.LEAGUES_READ)
    .input(Pagination.optional())
    .output(LeaguePaginated)
    .query(async ({ ctx, input }) => {
      const [total, data] = await Promise.all([
        LeagueModel.count(ctx.db),
        LeagueModel.getAll(ctx.db, input?.limit, input?.offset),
      ]);

      return { data, total };
    }),

  createLeague: permissionProcedure(PermissionEnum.LEAGUES_CREATE)
    .input(LeagueCreate)
    .output(League)
    .mutation(async ({ ctx, input }) => {
      return LeagueModel.create(ctx.db, input);
    }),

  updateLeague: permissionProcedure(PermissionEnum.LEAGUES_UPDATE)
    .input(LeagueUpdate)
    .output(League)
    .mutation(async ({ ctx, input }) => {
      return LeagueModel.update(ctx.db, input);
    }),

  deleteLeague: permissionProcedure(PermissionEnum.LEAGUES_DELETE)
    .input(League.pick({ uuid: true }))
    .output(League)
    .mutation(async ({ ctx, input }) => {
      return LeagueModel.delete(ctx.db, input.uuid);
    }),

  changeLeague$: permissionProcedure(PermissionEnum.LEAGUES_SWITCH)
    .input(League.pick({ uuid: true }))
    .output(League)
    .mutation(async ({ ctx, input }) => {
      const league = await LeagueModel.getByIdOrThrow(ctx.db, input.uuid);

      const newJWT = await sign({
        ...ctx.jwt,
        leagueUuid: league.uuid,
      });

      ctx.cookies.set(
        environment.JWT_COOKIE_NAME,
        newJWT,
        getJWTCookieOptions(ctx.cookieSecurity, new Date(ctx.jwt.exp * 1000)),
      );

      return league;
    }),

  leagueLink: permissionProcedure(PermissionEnum.LEAGUES_INVITE)
    .input(LeagueLinkQuery)
    .output(z.object({ link: z.url() }))
    .query(async ({ ctx, input }) => {
      const league = await LeagueModel.getByIdOrThrow(ctx.db, input.uuid);

      const link = await createMagicLink(
        {
          uuid: randomUUID(),

          origin: 'admin-league-link',

          role: input.role,
          leagueUuid: league.uuid,

          redirectTo: '/',
        },
        new Date(Date.now() + input.ttl),
      );

      return { link };
    }),
});
