import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { migrate } from 'drizzle-orm/pg-core';
import express from 'express';
import { db } from '#backend/db/database';
import { environment } from '#backend/environment';
import { createRouter } from '#backend/routers/router';
import { logger } from '#shared/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runServer() {
  const app = express();

  app.set('trust proxy', 'loopback');

  app.use(await createRouter());

  logger.info('Starting server on port %o...', environment.SERVER_PORT, {
    label: ['prod-server'],
  });

  app.listen(environment.SERVER_PORT).on('listening', () => {
    logger.info('Server listening on port %o', environment.SERVER_PORT, {
      label: ['prod-server'],
    });
  });
}

async function runMigrations() {
  try {
    logger.info('Running migrations...');

    const migrationsFolder = join(__dirname, 'migrations');
    await migrate([], db, { migrationsFolder });

    logger.info('Migrations applied successfully');

    await db.$client.end();
  } catch (err) {
    logger.error('Failed to apply migrations', {
      label: ['server', 'runMigrations'],
      error: err
    })

    await db.$client.end();
    return process.exit(1);
  }
}

async function main() {
  const program = new Command();

  program.name('Mundial Manager');

  program.action(runServer);

  program.command('migrate').action(runMigrations);

  await program.parseAsync();
}

main().catch((err) => {
  logger.error('Mundial Manager error', {
    label: ['server'],
    error: err,
  });
});
