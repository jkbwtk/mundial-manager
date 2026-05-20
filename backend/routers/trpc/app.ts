import { adminRouter } from '#backend/routers/trpc/admin';
import { ballsRouter } from '#backend/routers/trpc/balls';
import { leaguesRouter } from '#backend/routers/trpc/leagues';
import { seasonsRouter } from '#backend/routers/trpc/seasons';
import { sheetsRouter } from '#backend/routers/trpc/sheets';
import { systemRouter } from '#backend/routers/trpc/system';
import { tablesRouter } from '#backend/routers/trpc/tables';
import { router } from '#blib/trpc';

export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
  leagues: leaguesRouter,
  seasons: seasonsRouter,
  tables: tablesRouter,
  balls: ballsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
