import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { environment } from '#backend/environment';
import type { JWTContextCreate } from '#backend/types/auth';
import { Pagination } from '#backend/types/trpc';
import { sign } from '#blib/jwt';
import { runWithErrorConversion } from '#blib/modelErrors';
import { adminProcedure, router } from '#blib/trpc';
import { League, LeagueCreate, LeagueUpdate } from '#shared/types/api/league';

export const adminRouter = router({
  leagues: adminProcedure
    .input(Pagination.optional())
    .query(async ({ ctx, input }) => {
      const count = runWithErrorConversion(() => LeagueModel.count(ctx.db));
      const leagues = runWithErrorConversion(() =>
        LeagueModel.getAll(ctx.db, input?.limit, input?.offset),
      );

      const [total, data] = await Promise.all([count, leagues]);

      return {
        data: data.map((l) => l.serialize()),
        total,
      };
    }),

  createLeague: adminProcedure
    .input(LeagueCreate)
    .mutation(async ({ ctx, input }) => {
      const league = await runWithErrorConversion(() =>
        LeagueModel.create(ctx.db, input),
      );

      return league.serialize();
    }),

  updateLeague: adminProcedure
    .input(LeagueUpdate)
    .mutation(async ({ ctx, input }) => {
      const league = await runWithErrorConversion(() =>
        LeagueModel.update(ctx.db, input),
      );

      return league.serialize();
    }),

  deleteLeague: adminProcedure
    .input(League.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const league = await runWithErrorConversion(() =>
        LeagueModel.delete(ctx.db, input.uuid),
      );

      return league.serialize();
    }),

  changeLeague$: adminProcedure
    .input(League.pick({ uuid: true }))
    .mutation(async ({ ctx, input }) => {
      const league = await runWithErrorConversion(() =>
        LeagueModel.getById(ctx.db, input.uuid),
      );

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

      ctx.cookies.set(environment.JWT_COOKIE_NAME, newJWT, {
        httpOnly: true,
        secure: environment.PRODUCTION,
        sameSite: 'lax',
        overwrite: true,
        expires: new Date(ctx.jwt.exp * 1000),
      });

      return league.serialize();
    }),

  leagueLink: adminProcedure
    .input(League.pick({ uuid: true }))
    .query(async ({ ctx, input }) => {
      const league = await runWithErrorConversion(() =>
        LeagueModel.getById(ctx.db, input.uuid),
      );

      if (league === null) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'League not found',
        });
      }

      const jwt = await sign({
        uuid: randomUUID(),

        origin: 'admin-league-link',

        admin: false,
        leagueUuid: league.instance.uuid,

        redirectTo: '/',
      } satisfies JWTContextCreate);

      const params = new URLSearchParams();
      params.set('token', jwt);

      if (environment.NGINX_PARAM_KEY && environment.NGINX_SECRET) {
        params.set(environment.NGINX_PARAM_KEY, environment.NGINX_SECRET);
      }

      return {
        link: new URL(`/magic?${params}`, environment.BASE_SITE_URL).toString(),
      };
    }),
});
