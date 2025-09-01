import { systemRouter } from '#backend/routes/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
});

export type AppRouter = typeof appRouter;
