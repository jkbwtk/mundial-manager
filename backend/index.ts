import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { environment } from '#backend/environment';
import { appRouter } from '#backend/trpc';

const server = createHTTPServer({
  router: appRouter,
});

console.log(`Starting tRPC server on port ${environment.SERVER_PORT}...`);

server.listen(environment.SERVER_PORT).on('listening', () => {
  console.log(`tRPC server listening on port ${environment.SERVER_PORT}`);
});
