import { adminRouter } from '#backend/routers/trpc/admin';
import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
