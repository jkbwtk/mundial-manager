import { join } from 'node:path';
import type { Command } from 'commander';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { migrate } from 'drizzle-orm/pg-core';
import { db } from '#backend/db/database';
import { logger } from '#shared/logger';
import { projectRoot } from '#tools/cli-utils';

async function runMigrations(migrationsFolder: string) {
  try {
    logger.info('Running migrations...');

    const migrations = readMigrationFiles({ migrationsFolder });

    await migrate(migrations, db, { migrationsFolder });

    logger.info('Migrations applied successfully');
  } catch (err) {
    logger.error('Failed to apply migrations', {
      label: ['cli', 'migrate'],
      error: err,
    });

    process.exitCode = 1;
  }
}

export function registerMigrateCommand(
  program: Command,
  migrationsFolder?: string,
): void {
  const migrateCmd = program
    .command('migrate')
    .description('Run database migrations');

  migrateCmd.action(async () => {
    await runMigrations(migrationsFolder ?? join(projectRoot, 'drizzle'));

    await db.$client.end();
  });
}

export default registerMigrateCommand;
