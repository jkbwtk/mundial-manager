import { adminRouter } from '#backend/routers/trpc/admin';
import { ballsRouter } from '#backend/routers/trpc/balls';
import { leaguesRouter } from '#backend/routers/trpc/leagues';
import { matchesRouter } from '#backend/routers/trpc/matches';
import { matchTimelinesRouter } from '#backend/routers/trpc/matchTimelines';
import { playersRouter } from '#backend/routers/trpc/players';
import { seasonsRouter } from '#backend/routers/trpc/seasons';
import { systemRouter } from '#backend/routers/trpc/system';
import { tablesRouter } from '#backend/routers/trpc/tables';
import { router } from '#blib/trpc';

export const appRouter = router({
  system: systemRouter,
  leagues: leaguesRouter,
  seasons: seasonsRouter,
  tables: tablesRouter,
  balls: ballsRouter,
  players: playersRouter,
  matches: matchesRouter,
  matchTimelines: matchTimelinesRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
