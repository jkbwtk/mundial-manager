import { sheetsRouter } from '#backend/routes/sheets';
import { systemRouter } from '#backend/routes/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
});

export type AppRouter = typeof appRouter;
