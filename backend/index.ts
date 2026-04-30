import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { environment } from '#backend/environment';
import { appRouter } from '#backend/routes/app';
import { createBaseContext } from '#backend/trpc';
import { logger } from '#shared/logger';

const app = express();

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: createBaseContext,
  }),
);

logger.info('Starting server on port %o...', environment.SERVER_PORT, {
  label: ['backend'],
});

app.listen(environment.SERVER_PORT).on('listening', () => {
  logger.info('Server listening on port %o', environment.SERVER_PORT, {
    label: ['backend'],
  });
});
