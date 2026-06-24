import type { Command } from 'commander';
import z from 'zod';
import { db } from '#backend/db/database';
import { SheetStore } from '#backend/SheetStore';
import { logger } from '#shared/logger';
import { importLegacyPlayers } from '#tools/commands/import/players';
import { importLegacySeasons } from '#tools/commands/import/seasons';

const ImportOptions = z.object({
  clear: z.coerce.boolean(),
  leagueUuid: z.uuid(),
});
export type ImportOptions = z.infer<typeof ImportOptions>;

async function importData(options: ImportOptions) {
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

  const seasons = await importLegacySeasons(options);
  const players = await importLegacyPlayers(options, legacyMatches);

  console.log(seasons);
  console.log(players);
}

export function registerImportCommand(program: Command): void {
  const importCmd = program
    .command('import')
    .description('Import data from legacy data store')
    .requiredOption(
      '-l, --leagueUuid <uuid>',
      'League UUID to associate data with',
    )
    .option('--clear', 'Clear existing data before importing', false);

  importCmd.action(async (rawOptions: ImportOptions) => {
    const options = ImportOptions.parse(rawOptions);

    await importData(options);

    await db.$client.end();
  });
}

export default registerImportCommand;
