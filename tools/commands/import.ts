import type { Command } from 'commander';
import z from 'zod';
import { getAMQPChannel, runWithAMQPDisabled } from '#backend/amqp/amqp';
import { db } from '#backend/db/database';
import { matchesTable } from '#backend/db/schema';
import { SheetStore } from '#backend/SheetStore';
import { logger } from '#shared/logger';
import { importLegacyMatches } from '#tools/commands/import/matches';
import { importLegacyPlayers } from '#tools/commands/import/players';
import { importLegacySeasons } from '#tools/commands/import/seasons';
import { importLegacyTables } from '#tools/commands/import/tables';
import {
  DryRunRollback,
  formatImportError,
  ImportError,
} from '#tools/commands/import/utils';

const ImportOptions = z.object({
  clear: z.coerce.boolean(),
  dryRun: z.coerce.boolean(),
  leagueUuid: z.uuid(),
});
export type ImportOptions = z.infer<typeof ImportOptions>;

async function importData(options: ImportOptions) {
  if (options.dryRun && options.clear) {
    throw new Error('--dry-run cannot be combined with --clear');
  }

  logger.info('Importing legacy matches...', {
    label: ['cli', 'import'],
  });

  logger.debug('Loading legacy matches...', {
    label: ['cli', 'import'],
  });

  const sheetStore = new SheetStore();
  await sheetStore.initialize();

  const legacyMatches = await sheetStore.getMatches();

  logger.info('Loaded %d legacy matches', legacyMatches.length, {
    label: ['cli', 'import'],
  });

  try {
    await db.transaction(async (tx) => {
      if (options.clear) {
        logger.info('Clearing existing data from matches...', {
          label: ['cli', 'import'],
        });

        const deletedMatches = await tx.delete(matchesTable).returning();

        logger.info('Deleted %d matches', deletedMatches.length, {
          label: ['cli', 'import'],
        });
      }

      await importLegacySeasons(tx, options);
      const players = await importLegacyPlayers(tx, options, legacyMatches);
      const tables = await importLegacyTables(tx, options, legacyMatches);
      await importLegacyMatches(tx, options, legacyMatches, tables, players);

      if (options.dryRun) {
        throw new DryRunRollback();
      }
    });
  } catch (error) {
    if (error instanceof ImportError) {
      logger.error({
        message: formatImportError(error),
        label: ['cli', 'import'],
      });

      throw error;
    }

    if (!(error instanceof DryRunRollback)) throw error;

    logger.info(
      'Dry run: all legacy resources are valid, nothing was imported',
      {
        label: ['cli', 'import'],
      },
    );

    return;
  }

  logger.info('Successfully imported legacy data', {
    label: ['cli', 'import'],
  });
}

export function registerImportCommand(program: Command): void {
  const importCmd = program
    .command('import')
    .description('Import data from legacy data store')
    .requiredOption(
      '-l, --leagueUuid <uuid>',
      'League UUID to associate data with',
    )
    .option('--clear', 'Clear existing data before importing', false)
    .option(
      '--dry-run',
      'Validate every legacy resource and roll the import back',
      false,
    );

  importCmd.action(async (rawOptions: ImportOptions) => {
    const options = ImportOptions.parse(rawOptions);
    let failed = false;

    try {
      await runWithAMQPDisabled(() => importData(options));
    } catch (error) {
      failed = true;

      if (!(error instanceof ImportError)) {
        logger.error('Import failed', {
          label: ['cli', 'import'],
          error,
        });
      }
    }

    await db.$client.end();
    await (await getAMQPChannel()).close();

    process.exit(failed ? 1 : 0);
  });
}

export default registerImportCommand;
