import type { Command } from 'commander';
import { Argument } from 'commander';
import type { SemVer } from 'semver';
import { z } from 'zod';
import { logger } from '#shared/logger';
import { ReleaseType, ReleaseTypes } from '#shared/types/Changelog';
import {
  getCurrentVersion,
  getNextVersion,
  runCommandSync,
} from '#tools/cli-utils';

const VersionOptionsSchema = z.object({
  dryRun: z.boolean(),
  push: z.boolean(),
  message: z.string().optional(),
  sign: z.boolean(),
});

type VersionOptions = z.infer<typeof VersionOptionsSchema>;

function checkPackageStatus(): void {
  try {
    const status = runCommandSync('git status --porcelain');
    if (status.includes('package.json')) {
      logger.error(
        'Uncommitted changes in package.json. Please commit or stash your changes.',
        {
          label: ['cli', 'version', 'git'],
        },
      );
      process.exit(1);
    }
  } catch (err) {
    logger.error(
      'Failed to check git status. Make sure you are in a git repository.',
      {
        error: err,
        label: ['cli', 'version', 'git'],
      },
    );
    process.exit(1);
  }
}

function checkIfTagExists(tag: string): void {
  try {
    const output = runCommandSync(`git tag -l "${tag}"`);

    if (output.includes(tag)) {
      logger.error('Tag [%s] already exists', tag, {
        label: ['cli', 'version', 'git'],
      });
      process.exit(1);
    }
  } catch {
    logger.error(
      'Failed to check existing git tags. Make sure you are in a git repository.',
      {
        label: ['cli', 'version', 'git'],
      },
    );
    process.exit(1);
  }
}

function getCurrentBranch(): string {
  return runCommandSync('git branch --show-current').trim();
}

function revertChanges(
  tagName: string,
  commitMessage: string,
  currentVersion: SemVer,
) {
  logger.debug('Reverting created tag...');
  try {
    runCommandSync(`git tag -d "${tagName}"`);
  } catch (_err) {
    logger.warn('Failed to delete tag [%s]', tagName);
  }

  const latestCommitMsg = runCommandSync('git log -1 --pretty=%B').trim();
  if (latestCommitMsg === commitMessage) {
    logger.debug('Reverting version bump commit...');
    runCommandSync('git reset --soft HEAD~1');
  } else {
    logger.warn(
      'Latest commit message does not match version bump commit. Skipping revert.',
    );
  }

  logger.debug('Unstaging package.json changes...');
  runCommandSync('git reset HEAD package.json');

  logger.debug('Reverting package.json version change...');
  runCommandSync(`npm pkg set version=${currentVersion}`);

  logger.info('Reverted changes successfully');
}

function performVersionBump(
  newVersion: SemVer,
  tagName: string,
  tagMessage: string,
  commitMessage: string,
  options: VersionOptions,
): void {
  logger.debug('Updating package.json version...');
  runCommandSync(`npm pkg set version=${newVersion}`);

  logger.debug('Staging package.json...');
  runCommandSync('git add package.json');

  logger.debug(`Committing changes: "${commitMessage}"...`);
  runCommandSync(
    `git commit ${options.sign ? '-S' : ''} -m "${commitMessage}"`,
  );

  logger.debug(`Creating tag: ${tagName} with message ${tagMessage}...`);
  runCommandSync(`git tag -a "${tagName}" -m "${tagMessage}"`);

  logger.info(`Successfully created version ${newVersion} and tag ${tagName}`);
}

function pushToRemote(currentBranch: string, tagName: string): void {
  logger.debug('Pushing commits to remote...');
  runCommandSync(`git push origin ${currentBranch}`);

  logger.debug('Pushing tags to remote...');
  runCommandSync(`git push origin ${tagName}`);

  logger.info('Successfully pushed to remote');
}

export function registerVersionCommand(program: Command): void {
  const releaseTypeArgument = new Argument('[release type]', 'Release type')
    .choices(ReleaseTypes)
    .default('patch');

  const versionCmd = program
    .command('version')
    .description('Version update pipeline')
    .addArgument(releaseTypeArgument)
    .option(
      '-d, --dry-run',
      'Show what would be done without making changes',
      false,
    )
    .option('--no-push', 'Skip pushing commits and tags to remote')
    .option(
      '-m, --message <message>',
      'Custom tag annotation message (default: "Release X.X.X")',
      undefined,
    )
    .option('--no-sign', 'Sign the commit and tag');

  versionCmd.action((type: string, options: VersionOptions) => {
    try {
      const releaseType = ReleaseType.parse(type);
      const validatedOptions = VersionOptionsSchema.parse(options);

      const currentVersion = getCurrentVersion();
      const currentBranch = getCurrentBranch();
      const newVersion = getNextVersion(currentVersion, releaseType);
      const tagName = `v${newVersion}`;
      const tagMessage = validatedOptions.message ?? `Release ${newVersion}`;
      const commitMessage = `Bump version to ${newVersion}`;

      logger.info(`Current version: ${currentVersion}`);
      logger.info(`Current branch: ${currentBranch}`);
      logger.info(`Release type: ${releaseType}`);
      logger.info(`New version: ${newVersion}`);
      logger.info(`Tag name: ${tagName}`);
      logger.info(`Tag message: ${tagMessage}`);

      logger.info('Performing pre-checks...');
      logger.debug('Checking package status...');
      checkPackageStatus();

      logger.debug('Checking if tag already exists...');
      checkIfTagExists(tagName);

      logger.info('Performing version bump...');
      try {
        performVersionBump(
          newVersion,
          tagName,
          tagMessage,
          commitMessage,
          validatedOptions,
        );
      } catch (err) {
        logger.error('Version bump failed, attempting to recover...', {
          error: err,
          label: ['cli', 'version', 'bump'],
        });
        revertChanges(tagName, commitMessage, currentVersion);

        process.exit(1);
      }

      if (validatedOptions.dryRun) {
        logger.info('Dry run specified, reverting changes...');
        revertChanges(tagName, commitMessage, currentVersion);

        return;
      }

      if (validatedOptions.push) {
        logger.info('Pushing commits and tags to remote...');

        try {
          pushToRemote(currentBranch, tagName);
        } catch (err) {
          logger.error('Push to remote failed', {
            error: err,
            label: ['cli', 'version', 'push'],
          });

          revertChanges(tagName, commitMessage, currentVersion);

          process.exit(1);
        }
      } else {
        logger.info('Skipped pushing to remote (--no-push specified)');
        logger.info(
          `Run manually: git push origin ${currentBranch} && git push origin ${tagName}`,
        );
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error('Version command validation failed', {
          error: err,
          label: ['cli', 'version', 'validation'],
        });
      } else {
        logger.error('Version command failed', {
          error: err,
          label: ['cli', 'version'],
        });
      }
      process.exit(1);
    }
  });
}

export default registerVersionCommand;
