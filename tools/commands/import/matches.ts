import { db } from '#backend/db/database';
import { MatchModel } from '#backend/db/models/MatchModel';
import type { PlayerSelectSchema } from '#backend/types/db/player';
import type { TableSelectSchema } from '#backend/types/db/table';
import { getPlayersFromTeam } from '#flib/sheetUtils';
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

    await MatchModel.create(db, options.leagueUuid, {
      tableUuid: tables[match.floor ?? '']?.uuid,

      startDate: new Date((match.date ?? 0) * 1000),

      duration: Math.floor(match.duration ?? 0),
      pauseDuration: Math.floor(match.pauseDuration),

      side1Score: match.score1,
      side2Score: match.score2,

      status: 'FINISHED',

      playersSide1: getPlayersFromTeam(match.team1).map(
        // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: yeah
        (player) => players[player]?.uuid!,
      ),
      playersSide2: getPlayersFromTeam(match.team2).map(
        // biome-ignore lint/suspicious/noNonNullAssertedOptionalChain: yeah
        (player) => players[player]?.uuid!,
      ),

      spectators: [],
    });
  }

  logger.info('Successfully imported legacy matches', {
    label: ['cli', 'import', 'matches'],
  });
}
