import type { Command } from 'commander';
import z from 'zod';
import { db } from '#backend/db/database';
import { StatsFrameModel } from '#backend/db/models/StatsFrameModel';
import { logger } from '#shared/logger';
import { DryRunRollback } from '#tools/commands/import/utils';

const StatsOptions = z.object({
  dryRun: z.coerce.boolean(),
  leagueUuid: z.uuid(),
});
export type StatsOptions = z.infer<typeof StatsOptions>;

async function recalculateStats(options: StatsOptions) {
  logger.info('Recalculating stats of league %s...', options.leagueUuid, {
    label: ['cli', 'stats'],
  });

  try {
    await db.transaction(async (tx) => {
      const processed = await StatsFrameModel.recalculate(
        tx,
        options.leagueUuid,
        null,
      );

      logger.info('Recalculated stats of %d matches', processed, {
        label: ['cli', 'stats'],
      });

      if (options.dryRun) {
        throw new DryRunRollback();
      }
    });
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;

    logger.info('Dry run: stats were calculated and rolled back', {
      label: ['cli', 'stats'],
    });
  }
}

export function registerStatsCommand(program: Command): void {
  const statsCmd = program
    .command('stats')
    .description('Recalculate every stats frame of a league')
    .requiredOption('-l, --leagueUuid <uuid>', 'League UUID to recalculate')
    .option(
      '-d, --dry-run',
      'Calculate the stats and roll the changes back',
      false,
    );

  statsCmd.action(async (rawOptions: StatsOptions) => {
    const options = StatsOptions.parse(rawOptions);
    let failed = false;

    try {
      await recalculateStats(options);
    } catch (error) {
      failed = true;

      logger.error('Stats recalculation failed', {
        label: ['cli', 'stats'],
        error,
      });
    }

    await db.$client.end();

    process.exit(failed ? 1 : 0);
  });
}

export default registerStatsCommand;
