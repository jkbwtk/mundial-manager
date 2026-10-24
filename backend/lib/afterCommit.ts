import { AsyncLocalStorage } from 'node:async_hooks';
import { logger } from '#shared/logger';

interface AfterCommitEntry {
  value: unknown;
  effect: (value: unknown) => Promise<void>;
}

type AfterCommitScope = Map<string, AfterCommitEntry>;

const afterCommitStorage = new AsyncLocalStorage<AfterCommitScope>();

export async function runWithAfterCommit<T>(
  fn: () => Promise<T>,
): Promise<[result: T, flush: () => void]> {
  const scope: AfterCommitScope = new Map();
  const result = await afterCommitStorage.run(scope, fn);

  const flush = () => {
    for (const [key, entry] of scope) {
      entry.effect(entry.value).catch((err) => {
        logger.warn('Failed to run after commit effect %s', key, {
          label: ['afterCommit', 'flush'],
          error: err,
        });
      });
    }
  };

  return [result, flush];
}

export function afterCommit<T>(
  key: string,
  reduce: (current: T | null) => T,
  effect: (value: T) => Promise<void>,
): void {
  const scope = afterCommitStorage.getStore();

  if (scope === undefined) return;

  const current = scope.get(key);

  scope.set(key, {
    value: reduce(current === undefined ? null : (current.value as T)),
    effect: effect as AfterCommitEntry['effect'],
  });
}
