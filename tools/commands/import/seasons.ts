import type { TX } from '#backend/db/database';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { seasonsTable } from '#backend/db/schema';
import { seasons as legacySeasons } from '#flib/seasons';
import { logger } from '#shared/logger';
import type { ImportOptions } from '#tools/commands/import';
import { importResources } from '#tools/commands/import/utils';

export async function importLegacySeasons(tx: TX, options: ImportOptions) {
  logger.info('Importing legacy seasons...', {
    label: ['cli', 'import', 'seasons'],
  });

  if (options.clear) {
    logger.info('Clearing existing data from seasons...', {
      label: ['cli', 'import', 'seasons'],
    });

    const deletedSeasons = await tx.delete(seasonsTable).returning();

    logger.info('Deleted %d seasons', deletedSeasons.length, {
      label: ['cli', 'import', 'seasons'],
    });
  }

  logger.debug('Creating %d legacy seasons...', legacySeasons.length, {
    label: ['cli', 'import', 'seasons'],
  });

  const seasons = await importResources({
    name: 'seasons',
    label: ['cli', 'import', 'seasons'],
    sources: legacySeasons,
    describe: (season) => `season "${season.label}"`,
    create: (season) =>
      SeasonModel.create(tx, options.leagueUuid, {
        name: season.label,
        config: season.config,
        startDate: season.startDate.toDate(),
        endDate: season.endDate.toDate(),
        labels: {},
      }),
  });

  logger.info('Successfully imported legacy seasons', {
    label: ['cli', 'import', 'seasons'],
  });

  return seasons;
}
