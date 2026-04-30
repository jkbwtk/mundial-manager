import { Router } from 'express';
import { environment } from '#backend/environment';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';

async function createProdRouter() {
  const prodRouter = Router();

  prodRouter.use('/trpc', createTRPCRouter());

  return prodRouter;
}

async function createDevRouter() {
  const devRouter = Router();

  devRouter.use('/trpc', createTRPCRouter());

  return devRouter;
}

export async function createRouter() {
  if (environment.PRODUCTION) {
    return createProdRouter();
  }

  return createDevRouter();
}
