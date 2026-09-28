import {
  type AccessorWithLatest,
  createAsync,
  revalidate,
} from '@solidjs/router';
import {
  type Accessor,
  createSignal,
  getOwner,
  onCleanup,
  sharedConfig,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { onReconnect } from '#flib/network';
import { getValueHash } from '#shared/utils';

export interface ResilientAsyncOptions {
  name?: string;
  deferStream?: boolean;
}

export type ResilientAccessor<T> = AccessorWithLatest<T> & {
  error: Accessor<unknown>;
  retry: () => void;
};

type ResilientAsyncArgs<S, T> =
  | [fetcher: () => Promise<T>, options?: ResilientAsyncOptions]
  | [
      source: () => S,
      fetcher: (source: S) => Promise<T>,
      options?: ResilientAsyncOptions,
    ];

const RETRY_BASE_DELAY_MS = 10_000;
const RETRY_MAX_DELAY_MS = 60_000;
const RETRY_COALESCE_MS = 3000;

const [staleSources, setStaleSources] = createSignal<ReadonlySet<symbol>>(
  new Set(),
);

let retryTimeoutRef: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;
let lastRetryAt = 0;

function markStale(id: symbol, stale: boolean): void {
  setStaleSources((current) => {
    if (current.has(id) === stale) return current;

    const next = new Set(current);

    if (stale) {
      next.add(id);
    } else {
      next.delete(id);
    }

    return next;
  });
}

function scheduleRetry(): void {
  if (retryTimeoutRef !== undefined) return;

  const delay = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** retryAttempt,
    RETRY_MAX_DELAY_MS,
  );

  retryAttempt += 1;

  retryTimeoutRef = setTimeout(() => {
    retryTimeoutRef = undefined;

    if (document.visibilityState === 'visible') retryStaleData();
  }, delay);
}

export function hasStaleData(): boolean {
  return staleSources().size > 0;
}

export function retryStaleData(): void {
  clearTimeout(retryTimeoutRef);
  retryTimeoutRef = undefined;

  if (!hasStaleData() || Date.now() - lastRetryAt < RETRY_COALESCE_MS) return;

  lastRetryAt = Date.now();
  revalidate();
}

if (!isServer) {
  onReconnect(retryStaleData);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retryStaleData();
  });
}

export function createResilientAsync<T>(
  fetcher: () => Promise<T>,
  options?: ResilientAsyncOptions,
): ResilientAccessor<T | undefined>;
export function createResilientAsync<S, T>(
  source: () => S,
  fetcher: (source: S) => Promise<T>,
  options?: ResilientAsyncOptions,
): ResilientAccessor<T | undefined>;
export function createResilientAsync<S, T>(
  ...args: ResilientAsyncArgs<S, T>
): ResilientAccessor<T | undefined> {
  const [source, fetcher, options] =
    typeof args[1] === 'function'
      ? (args as [() => S, (source: S) => Promise<T>, ResilientAsyncOptions?])
      : [
          () => undefined as S,
          () => (args[0] as () => Promise<T>)(),
          args[1] as ResilientAsyncOptions | undefined,
        ];

  const id = Symbol(options?.name ?? 'resilientAsync');

  const [error, setError] = createSignal<unknown>(null);

  let valueKey: string | null = null;
  let lastCall = 0;

  const data = createAsync(async (previous: T | undefined) => {
    const input = source();
    const key = getValueHash(input);
    const request = fetcher(input);

    lastCall += 1;

    const call = lastCall;

    if (sharedConfig.context) valueKey = key;

    try {
      const value = await request;

      if (call === lastCall) valueKey = key;

      if (!isServer) {
        setError(null);
        markStale(id, false);

        if (!hasStaleData()) retryAttempt = 0;
      }

      return value;
    } catch (err) {
      if (isServer || previous === undefined || key !== valueKey) throw err;

      setError(() => err);
      markStale(id, true);
      scheduleRetry();

      return previous;
    }
  }, options) as ResilientAccessor<T | undefined>;

  if (!isServer && getOwner()) {
    onCleanup(() => markStale(id, false));
  }

  data.error = error;
  data.retry = retryStaleData;

  return data;
}
