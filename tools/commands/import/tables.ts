import { db } from '#backend/db/database';
import { TableModel } from '#backend/db/models/TableModel';
import { tablesTable } from '#backend/db/schema';
import type { TableSelectSchema } from '#backend/types/db/table';
import { logger } from '#shared/logger';
import type { Match } from '#shared/types/Sheets';
import type { ImportOptions } from '#tools/commands/import';

export async function importLegacyTables(
  options: ImportOptions,
  legacyMatches: Match[],
): Promise<Record<string, TableSelectSchema>> {
  logger.info('Importing legacy tables...', {
    label: ['cli', 'import', 'tables'],
  });

  const legacyFloors = Array.from(
    new Set(legacyMatches.map((match) => match.floor)),
  ).filter((floor) => floor !== null);

  if (options.clear) {
    logger.info('Clearing existing data from tables...', {
      label: ['cli', 'import', 'tables'],
    });

    const deletedTables = await db.delete(tablesTable).returning();

    logger.info('Deleted %d tables', deletedTables.length, {
      label: ['cli', 'import', 'tables'],
    });
  }

  logger.debug('Creating %d legacy tables...', legacyFloors.length, {
    label: ['cli', 'import', 'tables'],
  });

  const tables = await Promise.all(
    legacyFloors.map((floor) =>
      TableModel.create(db, options.leagueUuid, {
        name: `Floor ${floor}`,
        alias: String(floor),
        side1Color: '#363636',
        side2Color: '#acacac',
        location: `Floor ${floor}`,
        labels: [],
      }),
    ),
  );

  logger.info('Successfully imported legacy tables', {
    label: ['cli', 'import', 'tables'],
  });

  return Object.fromEntries(tables.map((table) => [table.alias, table]));
}
