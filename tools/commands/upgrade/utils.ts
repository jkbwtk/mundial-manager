import { isDeepStrictEqual } from 'node:util';
import { logger } from '#shared/logger';
import type { UpgradeOptions } from '#tools/commands/upgrade';

interface UpgradeRowsOptions<T, V> {
  name: string;
  label: string[];
  rows: T[];
  getStored: (row: T) => unknown;
  upgrade: (row: T) => V;
  save: (row: T, value: V) => Promise<unknown>;
}

export interface UpgradeFailure {
  uuid: string;
  error: unknown;
}

export interface UpgradeResult {
  checked: number;
  upgraded: number;
  failures: UpgradeFailure[];
}

export function isUpgradeRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getUpgradeLeagueFilter(options: UpgradeOptions): {
  leagueUuid?: string;
} {
  return options.leagueUuid === null ? {} : { leagueUuid: options.leagueUuid };
}

export async function upgradeRows<T extends { uuid: string }, V>(
  options: UpgradeRowsOptions<T, V>,
): Promise<UpgradeResult> {
  const failures: UpgradeFailure[] = [];

  let upgraded = 0;

  for (const row of options.rows) {
    let value: V;

    try {
      value = options.upgrade(row);
    } catch (error) {
      failures.push({ uuid: row.uuid, error });

      logger.warn('Failed to upgrade %s %s', options.name, row.uuid, {
        label: options.label,
        error,
      });

      continue;
    }

    if (isDeepStrictEqual(value, options.getStored(row))) continue;

    await options.save(row, value);

    upgraded += 1;
  }

  logger.info(
    'Upgraded %d of %d %s, %d failed',
    upgraded,
    options.rows.length,
    options.name,
    failures.length,
    { label: options.label },
  );

  return { checked: options.rows.length, upgraded, failures };
}
