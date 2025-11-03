import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver, { type SemVer } from 'semver';
import { logger } from '#shared/logger';
import {
  Changelog,
  type ReleaseType,
  type Version,
} from '#shared/types/Changelog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const projectRoot = resolve(__dirname, '..');

export const CHANGELOG_PATH = resolve(
  projectRoot,
  'frontend/assets/metadata/changelog.json',
);

export interface RunCommandOptions {
  cwd?: string;
  stdio?: 'pipe' | 'ignore' | 'inherit';
  env?: Record<string, string>;
}

export function spawnProcess(
  command: string,
  args: string[] = [],
  options: RunCommandOptions = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const { cwd = projectRoot, stdio = 'pipe', env = {} } = options;

    const child = spawn(command, args, {
      cwd,
      stdio,
      env: { ...process.env, ...env },
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    if (stdio === 'pipe') {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(`Command failed with code ${code}: ${stderr || stdout}`),
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

export function runCommandSync(command: string, cwd?: string): string {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .toString()
      .trim();
  } catch (err) {
    logger.error('Command execution failed: [%s]', command, {
      error: err,
      label: ['cli', 'version', 'command'],
    });
    throw new Error(`Command failed: ${command}`);
  }
}

export function getCurrentVersion(): SemVer {
  const versionStr = runCommandSync('npm pkg get version')
    .replace(/['"]/g, '')
    .trim();

  const version = semver.parse(versionStr);

  if (!version) {
    logger.error(
      'Failed to parse current version from package.json: [%s]',
      versionStr,
      {
        label: ['cli-utils', 'getCurrentVersion'],
      },
    );
    process.exit(1);
  }

  return version;
}

export function getNextVersion(
  currentVersion: SemVer,
  releaseType: ReleaseType,
): SemVer {
  const copy = semver.parse(currentVersion.version)!;

  return copy.inc(releaseType);
}

export function loadChangelog(): Changelog {
  try {
    const content = readFileSync(CHANGELOG_PATH, 'utf-8');
    return Changelog.decode(JSON.parse(content));
  } catch (err) {
    logger.error('Failed to load changelog from [%s]', CHANGELOG_PATH, {
      error: err,
      label: ['cli-utils', 'loadChangelog'],
    });
    process.exit(1);
  }
}

export function getLatestChangelogEntry(
  version: SemVer,
  changelog: Changelog,
): Version | undefined {
  const latestEntry = changelog.versions[0];

  if (latestEntry === undefined) return;

  const latestVersion = semver.parse(latestEntry.version);

  if (latestVersion === null) {
    logger.error(
      'Failed to parse latest changelog version: [%s]',
      latestEntry.version,
      {
        label: ['cli-utils', 'getLatestEntry'],
      },
    );
    process.exit(1);
  }

  if (semver.gt(latestVersion, version)) {
    logger.error(
      'Latest changelog version [%s] is greater than target version [%s]',
      latestVersion,
      version,
      {
        label: ['cli=utils', 'getLatestEntry'],
      },
    );
    process.exit(1);
  }

  if (semver.eq(latestVersion, version)) {
    return latestEntry;
  }
}
