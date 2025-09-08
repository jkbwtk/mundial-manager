import { Command } from 'commander';
import { z } from 'zod';

import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '#shared/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commandsDir = resolve(__dirname, 'commands');

const CommandModuleSchema = z.looseObject({
  default: z.custom<(program: Command) => void>(
    (fn) => typeof fn === 'function',
    { message: 'Expected a function' },
  ),
});

export async function discoverAndRegisterCommands(
  program: Command,
): Promise<void> {
  try {
    const commandFiles = readdirSync(commandsDir).filter(
      (file) => file.endsWith('.ts') && !file.startsWith('.'),
    );

    for (const commandFile of commandFiles) {
      try {
        const rawCommandModule = await import(join(commandsDir, commandFile));
        const commandModule = CommandModuleSchema.parse(rawCommandModule);
        const registerCommand = commandModule.default;

        registerCommand(program);
      } catch (err) {
        if (err instanceof z.ZodError) {
          logger.error(
            'Invalid command module structure in [%s]',
            commandFile,
            {
              error: err,
              label: ['cli', 'command-discovery'],
            },
          );
        } else {
          logger.error('Failed to load command [%s]', commandFile, {
            error: err,
            label: ['cli', 'command-discovery'],
          });
        }
      }
    }
  } catch (err) {
    logger.error('Error during command discovery', {
      error: err,
      label: ['cli', 'command-discovery'],
    });
    process.exit(1);
  }
}

async function main() {
  const program = new Command();

  program
    .name('mundial-cli')
    .description('Development tools for mundial-manager')
    .version('0.0.1');

  await discoverAndRegisterCommands(program);

  program.parse();
}

main().catch((err) => {
  logger.error('CLI Error', {
    error: err,
    label: ['cli'],
  });
  process.exit(1);
});
