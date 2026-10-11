import type { Command } from 'commander';
import { eq } from 'drizzle-orm';
import z from 'zod';
import { db, type TX } from '#backend/db/database';
import { matchOrderBy } from '#backend/db/matchOrder';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { StatsFrameModel } from '#backend/db/models/StatsFrameModel';
import { matchesTable } from '#backend/db/schema';
import { logger } from '#shared/logger';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { getStatsSessionKeys } from '#shared/stats/buckets';
import { SeasonConfig } from '#shared/types/api/season';
import { DryRunRollback } from '#tools/commands/import/utils';

const SpectatorsOptions = z.object({
  dryRun: z.coerce.boolean(),
  leagueUuid: z.uuid(),
});
export type SpectatorsOptions = z.infer<typeof SpectatorsOptions>;

async function getSessionPresence(tx: TX, leagueUuid: string) {
  const league = await LeagueModel.getById(tx, leagueUuid);
  const seasons = await tx.query.seasonsTable.findMany({
    where: { leagueUuid, $deletedAt: { isNull: true } },
  });
  const matches = await tx.query.matchesTable.findMany({
    where: { leagueUuid, $deletedAt: { isNull: true } },
    orderBy: matchOrderBy(),
  });

  const keys = getStatsSessionKeys(
    matches,
    league?.instance.timezone ?? 'UTC',
    seasons.map((season) => ({
      ...season,
      config: SeasonConfig.parse(season.config),
    })),
  );
  const sessionPlayers = new Map<string, Set<string>>();

  for (const match of matches) {
    const key = keys.get(match.uuid);

    if (key === undefined) continue;

    const players = sessionPlayers.get(key) ?? new Set();

    for (const uuid of getMatchPlayerUuids(match)) {
      players.add(uuid);
    }

    sessionPlayers.set(key, players);
  }

  return { matches, keys, sessionPlayers };
}

async function backfillSpectators(options: SpectatorsOptions) {
  try {
    await db.transaction(async (tx) => {
      const { matches, keys, sessionPlayers } = await getSessionPresence(
        tx,
        options.leagueUuid,
      );

      let updated = 0;
      let added = 0;

      for (const match of matches) {
        const key = keys.get(match.uuid);

        if (key === undefined) continue;

        const playing = new Set(getMatchPlayerUuids(match));
        const spectators = new Set(match.spectators);
        const before = spectators.size;

        for (const uuid of sessionPlayers.get(key) ?? []) {
          if (!playing.has(uuid)) spectators.add(uuid);
        }

        if (spectators.size === before) continue;

        added += spectators.size - before;
        updated += 1;

        await tx
          .update(matchesTable)
          .set({ spectators: [...spectators] })
          .where(eq(matchesTable.uuid, match.uuid));
      }

      logger.info(
        'Added %d spectators to %d matches in %d sessions',
        added,
        updated,
        sessionPlayers.size,
        { label: ['cli', 'spectators'] },
      );

      const processed = await StatsFrameModel.recalculate(
        tx,
        options.leagueUuid,
        null,
      );

      logger.info('Recalculated stats of %d matches', processed, {
        label: ['cli', 'spectators'],
      });

      if (options.dryRun) {
        throw new DryRunRollback();
      }
    });
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;

    logger.info('Dry run: spectator changes were rolled back', {
      label: ['cli', 'spectators'],
    });
  }
}

export function registerSpectatorsCommand(program: Command): void {
  const spectatorsCmd = program
    .command('spectators')
    .description(
      'Mark everyone who played in a session as present for its whole duration',
    )
    .requiredOption('-l, --leagueUuid <uuid>', 'League UUID to backfill')
    .option('-d, --dry-run', 'Run the backfill and roll it back', false);

  spectatorsCmd.action(async (rawOptions: SpectatorsOptions) => {
    const options = SpectatorsOptions.parse(rawOptions);
    let failed = false;

    try {
      await backfillSpectators(options);
    } catch (error) {
      failed = true;

      logger.error('Spectator backfill failed', {
        label: ['cli', 'spectators'],
        error,
      });
    }

    await db.$client.end();

    process.exit(failed ? 1 : 0);
  });
}

export default registerSpectatorsCommand;
