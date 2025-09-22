import { initTRPC } from '@trpc/server';
import { logger } from '#shared/logger';

const t = initTRPC.create({
  jsonl: {
    pingMs: 1000,
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
