import { Argument, type Command } from 'commander';
import { logger } from '#shared/logger';
import { fetchIcons } from '#tools/commands/fetch/icons';

const FetchTargets = ['icons'] as const;

type FetchTarget = (typeof FetchTargets)[number];

const fetchHandlers: Record<FetchTarget, () => Promise<void>> = {
  icons: fetchIcons,
};

async function fetchTarget(target: FetchTarget): Promise<void> {
  logger.info('Fetching %s...', target, {
    label: ['cli', 'fetch'],
  });

  try {
    await fetchHandlers[target]();
  } catch (err) {
    logger.error('Failed to fetch %s', target, {
      error: err,
      label: ['cli', 'fetch', target],
    });
    process.exit(1);
  }
}

export function registerFetchCommand(program: Command): void {
  const targetArgument = new Argument(
    '[target]',
    'Resource to fetch (omit to fetch all)',
  ).choices(FetchTargets);

  const fetchCmd = program
    .command('fetch')
    .description('Fetch external resources')
    .addArgument(targetArgument);

  fetchCmd.action(async (target: FetchTarget | undefined) => {
    const targets = target ? [target] : FetchTargets;

    for (const t of targets) {
      await fetchTarget(t);
    }
  });
}

export default registerFetchCommand;
