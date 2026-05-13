import { procedure, router } from '#blib/trpc';

export const systemRouter = router({
  ping: procedure.query(() => 'pong'),
});
