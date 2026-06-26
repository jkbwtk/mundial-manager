import { convertFromLegacyMatch } from '#backend/adapters/matchAdapter';
import { db } from '#backend/db/database';
import { MatchModel } from '#backend/db/models/MatchModel';
import type { PlayerSelectSchema } from '#backend/types/db/player';
import type { TableSelectSchema } from '#backend/types/db/table';
import { logger } from '#shared/logger';
import type { Match } from '#shared/types/Sheets';
import type { ImportOptions } from '#tools/commands/import';

export async function importLegacyMatches(
  options: ImportOptions,
  legacyMatches: Match[],
  tables: Record<string, TableSelectSchema>,
  players: Record<string, PlayerSelectSchema>,
) {
  logger.info('Importing legacy matches...', {
    label: ['cli', 'import', 'matches'],
  });

  logger.debug('Creating %d legacy matches...', legacyMatches.length, {
    label: ['cli', 'import', 'matches'],
  });

  for (const match of legacyMatches) {
    logger.debug('Processing legacy match #%d', match.id, {
      label: ['cli', 'import', 'matches'],
    });

    const converted = convertFromLegacyMatch(match, tables, players);
    await MatchModel.createFullMatch(db, options.leagueUuid, converted);
  }

  logger.info('Successfully imported legacy matches', {
    label: ['cli', 'import', 'matches'],
  });
}
