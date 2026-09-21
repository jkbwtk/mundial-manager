import { convertFromLegacyMatch } from '#backend/adapters/matchAdapter';
import type { TX } from '#backend/db/database';
import { MatchModel } from '#backend/db/models/MatchModel';
import type { PlayerSelectSchema } from '#backend/types/db/player';
import type { TableSelectSchema } from '#backend/types/db/table';
import { logger } from '#shared/logger';
import type { Match } from '#shared/types/Sheets';
import type { ImportOptions } from '#tools/commands/import';
import { importResources } from '#tools/commands/import/utils';

export async function importLegacyMatches(
  tx: TX,
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

  const matches = await importResources({
    name: 'matches',
    label: ['cli', 'import', 'matches'],
    sources: legacyMatches,
    describe: (match) => `match #${match.id}`,
    create: (match) =>
      MatchModel.createFull(
        tx,
        options.leagueUuid,
        convertFromLegacyMatch(match, tables, players),
      ),
  });

  logger.info('Successfully imported legacy matches', {
    label: ['cli', 'import', 'matches'],
  });

  return matches;
}
