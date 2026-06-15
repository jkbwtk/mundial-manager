import { type Command, Option } from 'commander';
import z from 'zod';
import { db } from '#backend/db/database';
import { logger } from '#shared/logger';
import { populateBalls } from '#tools/commands/populate/balls';
import { populatePlayers } from '#tools/commands/populate/players';
import { populateTables } from '#tools/commands/populate/tables';

const PopulateTargets = ['tables', 'balls', 'players'] as const;

type PopulateTarget = (typeof PopulateTargets)[number];

const PopulateOptions = z.object({
  clear: z.coerce.boolean(),
  count: z.coerce.number().int().positive(),
  leagueUuid: z.uuid(),
});
export type PopulateOptions = z.infer<typeof PopulateOptions>;

const populateHandlers: Record<
  PopulateTarget,
  (options: PopulateOptions) => Promise<void>
> = {
  tables: populateTables,
  balls: populateBalls,
  players: populatePlayers,
};

async function populateTarget(
  target: PopulateTarget,
  options: PopulateOptions,
): Promise<void> {
  logger.info('Populating %s...', target, {
    label: ['cli', 'populate'],
  });

  try {
    await populateHandlers[target](options);
  } catch (err) {
    logger.error('Failed to populate %s', target, {
      error: err,
      label: ['cli', 'populate', target],
    });
    process.exit(1);
  }
}

export function registerPopulateCommand(program: Command): void {
  const targetOption = new Option(
    '-t, --table [target...]',
    'Table(s) to populate (omit to populate all)',
  )
    .choices(PopulateTargets)
    .default(PopulateTargets);

  const populateCmd = program
    .command('populate')
    .description('Populate database with sample data')
    .requiredOption(
      '-l, --leagueUuid <uuid>',
      'League UUID to associate data with',
    )
    .addOption(targetOption)
    .option('--clear', 'Clear existing data before populating', false)
    .option(
      '-n, --count <number>',
      'Number of records to create per table',
      '10',
    );

  populateCmd.action(
    async ({
      table,
      ...rawOptions
    }: PopulateOptions & { table: PopulateTarget[] }) => {
      const options = PopulateOptions.parse(rawOptions);

      for (const target of table) {
        await populateTarget(target, options);
      }

      await db.$client.end();
    },
  );
}

export default registerPopulateCommand;
