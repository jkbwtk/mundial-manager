import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
});

export type AppRouter = typeof appRouter;
