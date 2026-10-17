import { Argument, type Command } from 'commander';
import z from 'zod';
import { db, type TX } from '#backend/db/database';
import { logger } from '#shared/logger';
import { DryRunRollback } from '#tools/commands/import/utils';
import { upgradeLeagues } from '#tools/commands/upgrade/leagues';
import { upgradeSeasons } from '#tools/commands/upgrade/seasons';
import { upgradeTimelines } from '#tools/commands/upgrade/timelines';
import type { UpgradeResult } from '#tools/commands/upgrade/utils';

const UpgradeTargets = ['seasons', 'leagues', 'timelines'] as const;

type UpgradeTarget = (typeof UpgradeTargets)[number];

const UpgradeOptions = z.object({
  dryRun: z.coerce.boolean(),
  leagueUuid: z.uuid().nullable().default(null),
});
export type UpgradeOptions = z.infer<typeof UpgradeOptions>;

const upgradeHandlers: Record<
  UpgradeTarget,
  (tx: TX, options: UpgradeOptions) => Promise<UpgradeResult>
> = {
  seasons: upgradeSeasons,
  leagues: upgradeLeagues,
  timelines: upgradeTimelines,
};

async function upgradeData(
  targets: readonly UpgradeTarget[],
  options: UpgradeOptions,
): Promise<number> {
  let failures = 0;

  try {
    await db.transaction(async (tx) => {
      for (const target of targets) {
        const result = await upgradeHandlers[target](tx, options);

        failures += result.failures.length;
      }

      if (options.dryRun) {
        throw new DryRunRollback();
      }
    });
  } catch (error) {
    if (!(error instanceof DryRunRollback)) throw error;

    logger.info('Dry run: upgrades were rolled back', {
      label: ['cli', 'upgrade'],
    });
  }

  return failures;
}

export function registerUpgradeCommand(program: Command): void {
  const targetArgument = new Argument(
    '[target]',
    'Data to upgrade (omit to upgrade all)',
  ).choices(UpgradeTargets);

  const upgradeCmd = program
    .command('upgrade')
    .description('Convert stored legacy data to the current schemas')
    .addArgument(targetArgument)
    .option(
      '-l, --leagueUuid <uuid>',
      'League UUID to upgrade (omit to upgrade every league)',
    )
    .option('-d, --dry-run', 'Run the upgrade and roll it back', false);

  upgradeCmd.action(
    async (target: UpgradeTarget | undefined, rawOptions: UpgradeOptions) => {
      const options = UpgradeOptions.parse(rawOptions);
      let failed = false;

      try {
        const failures = await upgradeData(
          target ? [target] : UpgradeTargets,
          options,
        );

        if (failures > 0) {
          failed = true;

          logger.error('%d rows could not be upgraded', failures, {
            label: ['cli', 'upgrade'],
          });
        }
      } catch (error) {
        failed = true;

        logger.error('Upgrade failed', {
          label: ['cli', 'upgrade'],
          error,
        });
      }

      await db.$client.end();

      process.exit(failed ? 1 : 0);
    },
  );
}

export default registerUpgradeCommand;
