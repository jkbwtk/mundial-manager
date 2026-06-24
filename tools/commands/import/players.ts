import { db } from '#backend/db/database';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { playersTable } from '#backend/db/schema';
import type { PlayerSelectSchema } from '#backend/types/db/player';
import { generateTeamColor, getPlayersFromTeam } from '#flib/sheetUtils';
import { logger } from '#shared/logger';
import type { Match } from '#shared/types/Sheets';
import type { ImportOptions } from '#tools/commands/import';

export async function importLegacyPlayers(
  options: ImportOptions,
  legacyMatches: Match[],
): Promise<Record<string, PlayerSelectSchema>> {
  logger.info('Importing legacy players...', {
    label: ['cli', 'import', 'players'],
  });

  const legacyPlayers = Array.from(
    new Set(
      legacyMatches.flatMap((match) => [
        ...getPlayersFromTeam(match.team1),
        ...getPlayersFromTeam(match.team2),
      ]),
    ),
  );

  if (options.clear) {
    logger.info('Clearing existing data from players...', {
      label: ['cli', 'import', 'players'],
    });

    const deletedPlayers = await db.delete(playersTable).returning();

    logger.info('Deleted %d players', deletedPlayers.length, {
      label: ['cli', 'import', 'players'],
    });
  }

  logger.debug('Creating %d legacy players...', legacyPlayers.length, {
    label: ['cli', 'import', 'players'],
  });

  const players = await Promise.all(
    legacyPlayers.map((player) =>
      PlayerModel.create(db, options.leagueUuid, {
        name: player,
        alias: player,
        color: generateTeamColor(player),
        labels: [],
      }),
    ),
  );

  logger.info('Successfully imported legacy players', {
    label: ['cli', 'import', 'players'],
  });

  return Object.fromEntries(players.map((player) => [player.name, player]));
}
