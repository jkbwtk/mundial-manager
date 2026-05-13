import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Router } from 'express';
import { appRouter } from '#backend/routers/trpc/app';
import { createBaseContext } from '#blib/trpc';

export function createTRPCRouter() {
  const trpcRouter = Router();

  trpcRouter.use(
    createExpressMiddleware({
      router: appRouter,
      createContext: createBaseContext,
    }),
  );

  return trpcRouter;
}
