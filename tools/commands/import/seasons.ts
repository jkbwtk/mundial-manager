import { eq } from 'drizzle-orm';
import type { TX } from '#backend/db/database';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { seasonsTable } from '#backend/db/schema';
import { seasons as legacySeasons } from '#flib/seasons';
import { defaultSeasonConfig } from '#shared/defaults/season';
import { logger } from '#shared/logger';
import { SeasonConfig } from '#shared/types/api/season';
import type { LegacySeasonConfig } from '#shared/types/Sheets';
import { withDefaults } from '#shared/zod';
import type { ImportOptions } from '#tools/commands/import';
import { importResources } from '#tools/commands/import/utils';

export function convertLegacySeasonConfig(
  config: LegacySeasonConfig,
): SeasonConfig {
  return withDefaults(SeasonConfig, defaultSeasonConfig).parse({
    resetRatings: config.resetRatings,
    ratings: {
      ELO: {
        defaultRating: config.defaultEloRating,
        kFactorRanges: config.eloKFactorRanges,
        scoreMultipliers: config.eloScoreMultipliers,
      },
      GLICKO2: {
        defaultRating: config.defaultGlicko2Rating,
        defaultRd: config.defaultGlicko2RD,
        defaultVolatility: config.defaultGlicko2Volatility,
      },
    },
  });
}

export async function importLegacySeasons(tx: TX, options: ImportOptions) {
  logger.info('Importing legacy seasons...', {
    label: ['cli', 'import', 'seasons'],
  });

  if (options.clear) {
    logger.info('Clearing existing data from seasons...', {
      label: ['cli', 'import', 'seasons'],
    });

    const deletedSeasons = await tx
      .delete(seasonsTable)
      .where(eq(seasonsTable.leagueUuid, options.leagueUuid))
      .returning();

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
        config: convertLegacySeasonConfig(season.config),
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
