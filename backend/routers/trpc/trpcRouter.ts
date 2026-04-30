import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { Router } from 'express';
import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { createBaseContext, router } from '#backend/trpc';

export function createTRPCRouter() {
  const trpcRouter = Router();

  const baseRouter = router({
    system: systemRouter,
    sheets: sheetsRouter,
  });

  trpcRouter.use(
    createExpressMiddleware({
      router: baseRouter,
      createContext: createBaseContext,
    }),
  );

  return trpcRouter;
}
