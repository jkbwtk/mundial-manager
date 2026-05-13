import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import Cookies from 'cookies';
import { db } from '#backend/db/database';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { getJWTContextFromCookies } from '#backend/jwt';
import { logger } from '#shared/logger';

export function createBaseContext(opts: CreateHTTPContextOptions) {
  const cookies = new Cookies(opts.req, opts.res);

  return {
    cookies,
    jwt: getJWTContextFromCookies(cookies),
    db,
  };
}

export type BaseContext = ReturnType<typeof createBaseContext>;

const t = initTRPC.context<BaseContext>().create({
  jsonl: {
    pingMs: 1000,
  },
  sse: {
    client: {
      reconnectAfterInactivityMs: 10000,
    },
    ping: {
      enabled: true,
      intervalMs: 2000,
    },
  },
});

export const router = t.router;
export const baseProcedure = t.procedure;

export const procedure = baseProcedure.use(async (opts) => {
  const t1 = performance.now();

  const result = await opts.next();

  logger.trpc({
    type: opts.type,
    path: opts.path,
    ok: result.ok,
    responseTime: performance.now() - t1,
    contentLength: result.ok ? JSON.stringify(result.data).length : -1,
  });

  return result;
});

export const restrictedProcedure = procedure.use(async (opts) => {
  const jwt = await opts.ctx.jwt;

  if (jwt === null) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid auth credentials',
    });
  }

  return opts.next({
    ctx: {
      jwt,
    },
  });
});

export const adminProcedure = restrictedProcedure.use(async (opts) => {
  const { jwt } = opts.ctx;

  if (!jwt.admin) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
    });
  }

  return opts.next();
});

export const leagueScopedProcedure = restrictedProcedure.use(async (opts) => {
  const { jwt } = opts.ctx;

  if (!jwt.leagueUuid) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'No league associated with the request credentials',
    });
  }

  const league = await LeagueModel.getById(opts.ctx.db, jwt.leagueUuid);

  if (!league) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'League associated with the request credentials does not exist',
    });
  }

  return opts.next({
    ctx: {
      league,
    },
  });
});
