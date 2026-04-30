import { Router } from 'express';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';

export async function createRouter() {
  const router = Router();

  router.use('/trpc', createTRPCRouter());

  return router;
}
