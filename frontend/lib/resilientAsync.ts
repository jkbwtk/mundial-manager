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

export const ResilientSkip = Symbol('ResilientSkip');
export type ResilientSkip = typeof ResilientSkip;

export interface ResilientAsyncOptions {
  name?: string;
  deferStream?: boolean;
}

export type ResilientQuery<A extends unknown[], T> = ((
  ...args: A
) => Promise<T>) & {
  keyFor: (...args: A) => string;
};

export type ResilientAccessor<T> = AccessorWithLatest<T> & {
  error: Accessor<unknown>;
  pending: Accessor<boolean>;
  retry: () => void;
};

interface ResilientResult<T> {
  key: string | null;
  value: T;
}

const RETRY_BASE_DELAY_MS = 10_000;
const RETRY_MAX_DELAY_MS = 60_000;
const RETRY_COALESCE_MS = 3000;

const [staleKeys, setStaleKeys] = createSignal<ReadonlyMap<string, number>>(
  new Map(),
);

let retryTimeoutRef: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;
let lastRetryAt = 0;

function countStaleKey(key: string, delta: number): void {
  setStaleKeys((current) => {
    const next = new Map(current);
    const count = (next.get(key) ?? 0) + delta;

    if (count > 0) {
      next.set(key, count);
    } else {
      next.delete(key);
    }

    return next;
  });
}

function retry(keys?: string[]): void {
  clearTimeout(retryTimeoutRef);
  retryTimeoutRef = undefined;

  if (!hasStaleData() || Date.now() - lastRetryAt < RETRY_COALESCE_MS) return;

  lastRetryAt = Date.now();
  revalidate(keys);
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
  return staleKeys().size > 0;
}

export function retryStaleData(): void {
  retry([...staleKeys().keys()]);
}

if (!isServer) {
  onReconnect(() => retry());

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retryStaleData();
  });
}

export function createResilientAsync<T>(
  query: ResilientQuery<[], T>,
  options?: ResilientAsyncOptions,
): ResilientAccessor<T | undefined>;
export function createResilientAsync<S, T>(
  source: () => NoInfer<S>,
  query: ResilientQuery<[S], T>,
  options?: ResilientAsyncOptions,
): ResilientAccessor<T | undefined>;
export function createResilientAsync<S, T>(
  source: () => NoInfer<S> | ResilientSkip,
  query: ResilientQuery<[S], T>,
  options?: ResilientAsyncOptions,
): ResilientAccessor<T | null | undefined>;
export function createResilientAsync<S, T>(
  ...args:
    | [ResilientQuery<[], T>, ResilientAsyncOptions?]
    | [() => S | ResilientSkip, ResilientQuery<[S], T>, ResilientAsyncOptions?]
): ResilientAccessor<T | null | undefined> {
  const [source, query, options] = (
    'keyFor' in args[0]
      ? [() => [], args[0], args[1]]
      : [
          () => {
            const input = (args[0] as () => S | ResilientSkip)();

            return input === ResilientSkip ? null : [input];
          },
          args[1],
          args[2],
        ]
  ) as [
    () => unknown[] | null,
    ResilientQuery<unknown[], T>,
    ResilientAsyncOptions | undefined,
  ];

  const [error, setError] = createSignal<unknown>(null);
  const [requestKey, setRequestKey] = createSignal<string | null>(null);

  let valueKey: string | null = null;
  let staleKey: string | null = null;
  let lastCall = 0;

  const setStaleKey = (key: string | null) => {
    if (key === staleKey) return;
    if (staleKey !== null) countStaleKey(staleKey, -1);
    if (key !== null) countStaleKey(key, 1);

    staleKey = key;
  };

  const result = createAsync(
    async (
      previous: ResilientResult<T | null> | undefined,
    ): Promise<ResilientResult<T | null>> => {
      const input = source();
      const key = input === null ? null : query.keyFor(...input);
      const request = input === null ? null : query(...input);

      lastCall += 1;

      const call = lastCall;

      setRequestKey(key);

      if (sharedConfig.context) valueKey = key;

      try {
        const value = await request;

        if (call === lastCall) valueKey = key;

        if (!isServer) {
          setError(null);
          setStaleKey(null);

          if (!hasStaleData()) retryAttempt = 0;
        }

        return { key, value };
      } catch (err) {
        if (isServer || previous === undefined || key !== valueKey) throw err;

        setError(() => err);
        setStaleKey(key);
        scheduleRetry();

        return { key, value: previous.value };
      }
    },
    options,
  );

  const data = (() => result()?.value) as ResilientAccessor<
    T | null | undefined
  >;

  Object.defineProperty(data, 'latest', {
    get: () => result.latest?.value,
  });

  if (!isServer && getOwner()) {
    onCleanup(() => setStaleKey(null));
  }

  data.error = error;
  data.pending = () =>
    !isServer && requestKey() !== (result.latest?.key ?? null);
  data.retry = retryStaleData;

  return data;
}
