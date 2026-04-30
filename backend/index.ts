import express from 'express';
import { environment } from '#backend/environment';
import { createRouter } from '#backend/routers/router';
import { logger } from '#shared/logger';

const app = express();

app.use(await createRouter());

logger.info('Starting server on port %o...', environment.SERVER_PORT, {
  label: ['backend'],
});

app.listen(environment.SERVER_PORT).on('listening', () => {
  logger.info('Server listening on port %o', environment.SERVER_PORT, {
    label: ['backend'],
  });
});
