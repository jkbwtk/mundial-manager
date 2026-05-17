import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { environment } from '#backend/environment';
import type { JWTContextCreate } from '#backend/types/auth';
import { PaginationInput } from '#backend/types/trpc';
import { sign } from '#blib/jwt';
import { runWithErrorConversion } from '#blib/modelErrors';
import { adminProcedure, router } from '#blib/trpc';
import { League, LeagueCreate } from '#shared/types/api/league';

export const adminRouter = router({
  leagues: adminProcedure
    .input(PaginationInput.optional())
    .query(async ({ ctx, input }) => {
      const leagues = LeagueModel.getAll(ctx.db, input?.limit, input?.offset);
      const total = LeagueModel.count(ctx.db);

      return {
        data: (await leagues).map((l) => l.serialize()),
        total: await total,
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

  changeLeague$: adminProcedure
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
      const league = await LeagueModel.getById(ctx.db, input.uuid);

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
