import { faker } from '@faker-js/faker';
import { db } from '#backend/db/database';
import { TableModel } from '#backend/db/models/TableModel';
import { tablesTable } from '#backend/db/schema';
import { runWithErrorConversion } from '#blib/modelErrors';
import { logger } from '#shared/logger';
import { range } from '#shared/utils';
import type { PopulateOptions } from '#tools/commands/populate';

export async function populateTables(options: PopulateOptions): Promise<void> {
  if (options.clear) {
    logger.info('Clearing existing data from tables...', {
      label: ['cli', 'populate', 'tables'],
    });

    const deletedTables = await db.delete(tablesTable).returning();

    logger.info('Deleted %d tables', deletedTables.length, {
      label: ['cli', 'populate', 'tables'],
    });
  }

  logger.info('Populating tables with %d records...', options.count, {
    label: ['cli', 'populate', 'tables'],
  });

  await Promise.all(
    range(options.count).map(() =>
      runWithErrorConversion(() =>
        TableModel.create(db, options.leagueUuid, {
          name: faker.lorem.words({ min: 4, max: 8 }),
          alias: faker.string.alphanumeric({
            casing: 'upper',
            length: { min: 3, max: 5 },
          }),
          location: faker.location.streetAddress(),
          side1Color: faker.color.rgb({ format: 'hex' }),
          side2Color: faker.color.rgb({ format: 'hex' }),
          description:
            Math.random() > 0.8
              ? faker.lorem.paragraphs({ min: 1, max: 1 })
              : null,
          labels: [],
        }),
      ),
    ),
  );

  logger.info('Finished populating tables', {
    label: ['cli', 'populate', 'tables'],
  });
}
