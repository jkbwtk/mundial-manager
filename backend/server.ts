#!node

import { Command } from 'commander';
import express from 'express';
import { environment } from '#backend/environment';
import { createRouter } from '#backend/routers/router';
import { logger } from '#shared/logger';
import registerImportCommand from '#tools/commands/import';
import registerMigrateCommand from '#tools/commands/migrate';

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

async function main() {
  const program = new Command();

  program.name('Mundial Manager');

  program.action(runServer);

  registerMigrateCommand(program, '/app/private/backend/migrations');
  registerImportCommand(program);

  await program.parseAsync();
}

main().catch((err) => {
  logger.error('Mundial Manager error', {
    label: ['server'],
    error: err,
  });
});
