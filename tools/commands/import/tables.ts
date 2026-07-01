import { db } from '#backend/db/database';
import { TableModel } from '#backend/db/models/TableModel';
import { tablesTable } from '#backend/db/schema';
import type { TableSelectSchema } from '#backend/types/db/table';
import { logger } from '#shared/logger';
import type { Match } from '#shared/types/Sheets';
import type { ImportOptions } from '#tools/commands/import';

interface LegacyFloor {
  floor: number;
  colors: Set<string>;
}

export async function importLegacyTables(
  options: ImportOptions,
  legacyMatches: Match[],
): Promise<Record<string, TableSelectSchema>> {
  logger.info('Importing legacy tables...', {
    label: ['cli', 'import', 'tables'],
  });

  const legacyFloors: Map<number, LegacyFloor> = new Map();

  for (const match of legacyMatches) {
    if (match.floor === null) continue;

    const existing = legacyFloors.getOrInsert(match.floor, {
      floor: match.floor,
      colors: new Set(),
    });

    if (match.winningColor && match.winningColor !== 'unknown') {
      existing.colors.add(match.winningColor);
    }
  }

  if (options.clear) {
    logger.info('Clearing existing data from tables...', {
      label: ['cli', 'import', 'tables'],
    });

    const deletedTables = await db.delete(tablesTable).returning();

    logger.info('Deleted %d tables', deletedTables.length, {
      label: ['cli', 'import', 'tables'],
    });
  }

  logger.debug('Creating %d legacy tables...', legacyFloors.size, {
    label: ['cli', 'import', 'tables'],
  });

  const tables = await Promise.all(
    legacyFloors.values().map((floor) => {
      const colors = Array.from(floor.colors).sort();

      return TableModel.create(db, options.leagueUuid, {
        name: `Floor ${floor.floor}`,
        alias: String(floor.floor),
        side1Color: '#363636',
        side2Color: '#acacac',
        location: `Floor ${floor.floor}`,
        labels: {
          legacyImportFloor: floor.floor,
          legacyImportSide1Color: colors.at(0) ?? 'unknown',
          legacyImportSide2Color: colors.at(1) ?? 'unknown',
        },
      });
    }),
  );

  logger.info('Successfully imported legacy tables', {
    label: ['cli', 'import', 'tables'],
  });

  return Object.fromEntries(tables.map((table) => [table.alias, table]));
}
