import { adminRouter } from '#backend/routers/trpc/admin';
import { leaguesRouter } from '#backend/routers/trpc/leagues';
import { seasonsRouter } from '#backend/routers/trpc/seasons';
import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { router } from '#backend/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
  leagues: leaguesRouter,
  seasons: seasonsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
