import express from 'express';
import { environment } from '#backend/environment';
import { logger } from '#shared/logger';
import { createDevRouter } from './routers/devRouter';

const app = express();

app.use(await createDevRouter());

logger.info('Starting dev server on port %o...', environment.SERVER_PORT, {
  label: ['dev-server'],
});

app.listen(environment.SERVER_PORT).on('listening', () => {
  logger.info('Dev server listening on port %o', environment.SERVER_PORT, {
    label: ['dev-server'],
  });
});
