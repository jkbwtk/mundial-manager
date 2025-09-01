import { initTRPC } from '@trpc/server';
import z from 'zod';
import { logger } from '#shared/logger';

const t = initTRPC.create();

export const router = t.router;
export const baseProcedure = t.procedure;

const publicProcedure = baseProcedure.use(async (opts) => {
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

export const appRouter = router({
  add: publicProcedure
    .input(
      z.object({
        a: z.number(),
        b: z.number(),
      }),
    )
    .query(({ input }) => {
      return input.a + input.b;
    }),
});

export type AppRouter = typeof appRouter;
