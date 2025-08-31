import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { environment } from '#backend/environment';
import { appRouter } from '#backend/trpc';
import { logger } from '#shared/logger';

const server = createHTTPServer({
  router: appRouter,
});

logger.info('Starting tRPC server on port %o...', environment.SERVER_PORT, {
  label: ['backend'],
});

server.listen(environment.SERVER_PORT).on('listening', () => {
  logger.info('tRPC server listening on port %o', environment.SERVER_PORT, {
    label: ['backend'],
  });
});
