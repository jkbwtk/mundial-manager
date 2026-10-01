import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import Cookies from 'cookies';
import { type DB, db } from '#backend/db/database';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { HttpError } from '#backend/errors/http';
import type { JWTContext } from '#backend/types/auth';
import { getCookieSecurity, getJWTContextFromCookies } from '#blib/jwt';
import { memoized } from '#blib/memoized';
import { ModelError } from '#blib/modelErrors';
import { logger } from '#shared/logger';

export function createLeagueGetter(
  db: DB,
  jwt: Promise<JWTContext | null>,
): () => Promise<LeagueModel | null> {
  return memoized(async () => {
    const context = await jwt;

    if (!context?.leagueUuid) return null;

    return LeagueModel.getById(db, context.leagueUuid);
  });
}

export function createBaseContext(opts: CreateHTTPContextOptions) {
  const cookies = new Cookies(opts.req, opts.res);
  const jwt = getJWTContextFromCookies(cookies);

  return {
    cookies,
    cookieSecurity: getCookieSecurity(opts.req),
    jwt,
    getLeague: createLeagueGetter(db, jwt),
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

export const baseProcedure = t.procedure.use(async (opts) => {
  const result = await opts.next();

  if (
    !result.ok &&
    (result.error.cause instanceof ModelError ||
      result.error.cause instanceof HttpError)
  ) {
    return { ...result, error: result.error.cause.toTRPCError() };
  }

  return result;
});

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

  const league = await opts.ctx.getLeague();

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
