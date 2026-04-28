import { initTRPC } from '@trpc/server';
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import Cookies from 'cookies';
import { environment } from '#backend/environment';
import { sign, verify } from '#backend/jwt';
import { logger } from '#shared/logger';

export function createBaseContext(opts: CreateHTTPContextOptions) {
  const cookies = new Cookies(opts.req, opts.res);

  const cookieName = environment.JWT_COOKIE_NAME;

  try {
    const oldCookie = cookies.get(cookieName);
    logger.debug('Old cookie value: %s', oldCookie);

    if (oldCookie) {
      const validated = verify(oldCookie ?? '');
      logger.debug('Validated cookie value: %s', validated);
    }

    const newValue = {
      timestamp: Date.now(),
      data: 'test',
    };
    logger.debug('Setting new cookie value: %s', newValue);

    const signed = sign(newValue);

    cookies.set(cookieName, signed, {
      httpOnly: true,
      sameSite: 'lax',
    });
  } catch (err) {
    logger.error('Failed to process JWT cookie', {
      error: err,
      label: ['createBaseContext'],
    });

    cookies.set(cookieName, null);
  }

  return {};
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
  return opts.next();
});
