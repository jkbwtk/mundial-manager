import { procedure, router } from '#backend/trpc';

export const systemRouter = router({
  ping: procedure.query(() => 'pong'),
});
