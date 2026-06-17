import { faker } from '@faker-js/faker';
import { db } from '#backend/db/database';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { playersTable } from '#backend/db/schema';
import { logger } from '#shared/logger';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

export async function populatePlayers(options: PopulateOptions): Promise<void> {
  if (options.clear) {
    logger.info('Clearing existing data from players...', {
      label: ['cli', 'populate', 'players'],
    });

    const deletedPlayers = await db.delete(playersTable).returning();

    logger.info('Deleted %d players', deletedPlayers.length, {
      label: ['cli', 'populate', 'players'],
    });
  }

  logger.info('Populating players with %d records...', options.count, {
    label: ['cli', 'populate', 'players'],
  });

  await Promise.all(
    range(options.count).map(() =>
      PlayerModel.create(db, options.leagueUuid, {
        name: faker.person.fullName(),
        alias: faker.internet.username(),
        color: faker.color.rgb({ format: 'hex' }),
        labels: [],
      }),
    ),
  );

  logger.info('Finished populating players', {
    label: ['cli', 'populate', 'players'],
  });
}
