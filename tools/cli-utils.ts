import { execSync, spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '#shared/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const projectRoot = resolve(__dirname, '..');

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
