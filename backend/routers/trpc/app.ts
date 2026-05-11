import { adminRouter } from '#backend/routers/trpc/admin';
import { leagueRouter } from '#backend/routers/trpc/league';
import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
  league: leagueRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
