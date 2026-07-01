import { faker } from '@faker-js/faker';
import { db } from '#backend/db/database';
import { BallModel } from '#backend/db/models/BallModel';
import { ballsTable } from '#backend/db/schema';
import { logger } from '#shared/logger';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

export async function populateBalls(options: PopulateOptions): Promise<void> {
  if (options.clear) {
    logger.info('Clearing existing data from balls...', {
      label: ['cli', 'populate', 'balls'],
    });

    const deletedBalls = await db.delete(ballsTable).returning();

    logger.info('Deleted %d balls', deletedBalls.length, {
      label: ['cli', 'populate', 'balls'],
    });
  }

  logger.info('Populating balls with %d records...', options.count, {
    label: ['cli', 'populate', 'balls'],
  });

  await Promise.all(
    range(options.count).map(() =>
      BallModel.create(db, options.leagueUuid, {
        name: faker.lorem.words({ min: 1, max: 3 }),
        alias: faker.string.alphanumeric({
          casing: 'upper',
          length: { min: 3, max: 5 },
        }),
        color: faker.color.rgb({ format: 'hex' }),
        diameter: faker.number.int({ min: 10, max: 25 }),
        weight: faker.number.int({ min: 15, max: 25 }),
        description:
          Math.random() > 0.8
            ? faker.lorem.paragraphs({ min: 1, max: 1 })
            : null,
        labels: {},
      }),
    ),
  );

  logger.info('Finished populating balls', {
    label: ['cli', 'populate', 'balls'],
  });
}
