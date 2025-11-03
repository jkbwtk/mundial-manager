import { writeFileSync } from 'node:fs';
import type { Command } from 'commander';
import { Argument } from 'commander';
import type { SemVer } from 'semver';
import { z } from 'zod';
import { logger } from '#shared/logger';
import {
  type Change,
  Changelog,
  type Commit,
  ReleaseType,
  ReleaseTypes,
  Version,
} from '#shared/types/Changelog';
import {
  CHANGELOG_PATH,
  getCurrentVersion,
  getLatestChangelogEntry,
  getNextVersion,
  loadChangelog,
  runCommandSync,
} from '#tools/cli-utils';

const ChangelogOptionsSchema = z.object({
  name: z.string().optional(),
  output: z.string().optional().default(CHANGELOG_PATH),
  dryRun: z.boolean(),
});

type ChangelogOptions = z.infer<typeof ChangelogOptionsSchema>;

function saveChangelog(changelog: Changelog, outputPath: string): void {
  try {
    const content = JSON.stringify(Changelog.encode(changelog), null, 2);
    writeFileSync(outputPath, content, 'utf-8');
    logger.info('Changelog saved to [%s]', outputPath);
  } catch (err) {
    logger.error('Failed to save changelog to [%s]', outputPath, {
      error: err,
      label: ['cli', 'changelog', 'saveChangelog'],
    });
    process.exit(1);
  }
}

function getCommitsSinceLastRelease(): Commit[] {
  try {
    const lastTag = runCommandSync('git describe --tags --abbrev=0').trim();
    const commits = runCommandSync(
      `git log ${lastTag}..HEAD --pretty=format:"%H|||%s"`,
    );

    if (!commits) {
      logger.warn('No commits found since last release [%s]', lastTag);
      return [];
    }

    return commits
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const [hash, message] = line.split('|||');
        return {
          hash: hash?.trim().slice(0, 10) || '',
          message: message?.trim() || '',
        };
      })
      .filter((commit) => commit.hash && commit.message);
  } catch (err) {
    logger.warn('Failed to get commits since last release', {
      error: err,
      label: ['cli', 'changelog', 'getCommitsSinceLastRelease'],
    });
    return [];
  }
}

function createVersionEntry(
  version: SemVer,
  releaseType: ReleaseType,
  name: string,
  existingEntry?: Version,
): Version {
  const commits = getCommitsSinceLastRelease();
  const changes: Change[] = [];

  logger.info('Found %d commits since last release', commits.length);

  return {
    version: version.version,
    releaseType,
    date: new Date(),
    name,
    changes: [...(existingEntry?.changes ?? []), ...changes],
    commits,
  };
}

export function registerChangelogCommand(program: Command): void {
  const releaseTypeArgument = new Argument('[release type]', 'Release type')
    .choices(ReleaseTypes)
    .default('patch');

  const changelogCmd = program
    .command('changelog')
    .description('Generate changelog entry for the next release')
    .addArgument(releaseTypeArgument)
    .option('-n, --name <name>', 'Release name', undefined)
    .option(
      '-o, --output <path>',
      'Output path (default: frontend/assets/metadata/changelog.json)',
      undefined,
    )
    .option('-d, --dry-run', 'Preview changelog without saving changes', false);

  changelogCmd.action((type: string, options: ChangelogOptions) => {
    try {
      const releaseType = ReleaseType.parse(type);
      const validatedOptions = ChangelogOptionsSchema.parse(options);

      const currentVersion = getCurrentVersion();
      const nextVersion = getNextVersion(currentVersion, releaseType);
      const releaseName =
        validatedOptions.name ?? `Release ${nextVersion.version}`;

      logger.info('Current version: %s', currentVersion);
      logger.info('Release type: %s', releaseType);
      logger.info('Next version: %s', nextVersion);
      logger.info('Release name: %s', releaseName);

      const changelog = loadChangelog();

      logger.info('Performing pre-checks...');
      logger.debug('Checking for version conflicts...');
      const existingEntry = getLatestChangelogEntry(nextVersion, changelog);

      if (existingEntry) {
        logger.warn(
          'Changelog entry for version %s already exists. Merging...',
          nextVersion,
        );

        logger.info('Existing entry name: %s', existingEntry.name);
        logger.info(
          'Existing entry date: %s',
          existingEntry.date.toISOString().split('T')[0],
        );
        logger.info('Existing entry changes: %d', existingEntry.changes.length);
        logger.info('Existing entry commits: %d', existingEntry.commits.length);

        changelog.versions.shift();
      }

      const versionEntry = createVersionEntry(
        nextVersion,
        releaseType,
        releaseName,
        existingEntry,
      );

      logger.info('Created changelog entry:');
      logger.info('Version: %s', versionEntry.version);
      logger.info('Name: %s', versionEntry.name);
      logger.info('Date: %s', versionEntry.date.toISOString().split('T')[0]);
      logger.info('Changes: %d', versionEntry.changes.length);
      logger.info('Commits: %d', versionEntry.commits.length);

      if (versionEntry.commits.length > 0) {
        logger.info('Commits:');
        for (const commit of versionEntry.commits) {
          logger.info('  - %s: %s', commit.hash.slice(0, 7), commit.message);
        }
      }

      changelog.versions.unshift(versionEntry);

      if (validatedOptions.dryRun) {
        logger.info('Dry run specified, not saving changelog changes.');
        logger.info(
          'Preview:\n%s',
          JSON.stringify(Version.encode(versionEntry), null, 2),
        );
      } else {
        saveChangelog(changelog, validatedOptions.output);
        logger.info('Edit [%s] to add change details', validatedOptions.output);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.error('Changelog command validation failed', {
          error: err,
          label: ['cli', 'changelog', 'validation'],
        });
      } else {
        logger.error('Changelog command failed', {
          error: err,
          label: ['cli', 'changelog'],
        });
      }
      process.exit(1);
    }
  });
}

export default registerChangelogCommand;
