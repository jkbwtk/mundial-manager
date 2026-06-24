import { db } from '#backend/db/database';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { seasonsTable } from '#backend/db/schema';
import { seasons as legacySeasons } from '#flib/seasons';
import { logger } from '#shared/logger';
import type { ImportOptions } from '#tools/commands/import';

export async function importLegacySeasons(options: ImportOptions) {
  logger.info('Importing legacy seasons...', {
    label: ['cli', 'import', 'seasons'],
  });

  if (options.clear) {
    logger.info('Clearing existing data from seasons...', {
      label: ['cli', 'import', 'seasons'],
    });

    const deletedSeasons = await db.delete(seasonsTable).returning();

    logger.info('Deleted %d seasons', deletedSeasons.length, {
      label: ['cli', 'import', 'seasons'],
    });
  }

  logger.debug('Creating %d legacy seasons...', legacySeasons.length, {
    label: ['cli', 'import', 'seasons'],
  });

  const seasons = await Promise.all(
    legacySeasons.map((season) =>
      SeasonModel.create(db, options.leagueUuid, {
        name: season.label,
        config: {},
        startDate: season.startDate.toDate(),
        endDate: season.endDate.toDate(),
        labels: [],
      }),
    ),
  );

  logger.info('Successfully imported legacy players', {
    label: ['cli', 'import', 'players'],
  });

  return seasons;
}
