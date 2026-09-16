import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Router } from 'express';
import { appRouter } from '#backend/routers/trpc/app';
import { createBaseContext } from '#blib/trpc';
import { logger } from '#shared/logger';

export function createTRPCRouter() {
  const trpcRouter = Router();

  trpcRouter.use(
    createExpressMiddleware({
      router: appRouter,
      createContext: createBaseContext,
      onError: ({ error, path }) => {
        if (error.code !== 'INTERNAL_SERVER_ERROR') return;

        logger.error('Error during TRPC call', {
          label: ['trpc', path ?? 'unknown'],
          error,
        });
      },
    }),
  );

  return trpcRouter;
}
