import { type Accessor, createEffect, on, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import z from 'zod';
import { jsonCodec } from '#shared/zod';

export interface StoredDraft<T> {
  savedAt: number;
  base: string;
  data: T;
}

export interface DraftStore<T> {
  read: (key: string) => StoredDraft<T> | null;
  write: (key: string, base: string, data: T) => boolean;
  remove: (key: string) => void;
}

export interface PersistDraftOptions<T> {
  store: DraftStore<T>;
  key: Accessor<string | null>;
  isDirty: Accessor<boolean>;
  base: Accessor<string>;
  snapshot: Accessor<T>;

  onWriteError?: () => void;
}

export interface DraftPersistence {
  flush: () => void;
  clear: () => void;
}

const STORAGE_PREFIX = 'draft:';
const WRITE_DELAY_MS = 1000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function getStorage(): Storage | null {
  if (isServer) return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createDraftStore<T>(
  namespace: string,
  schema: z.ZodType<T>,
  version = 1,
): DraftStore<T> {
  const VersionedDraft = jsonCodec(
    z.object({
      version: z.number(),
      savedAt: z.number(),
      base: z.string(),
      data: schema,
    }),
  );

  const getStorageKey = (key: string) => `${STORAGE_PREFIX}${namespace}:${key}`;

  const read = (key: string): StoredDraft<T> | null => {
    const storage = getStorage();

    if (storage === null) return null;

    const storageKey = getStorageKey(key);
    const stored = storage.getItem(storageKey);

    if (stored === null) return null;

    const result = VersionedDraft.safeDecode(stored);

    if (!result.success) {
      console.error('Draft read error:', result.error);
      storage.removeItem(storageKey);

      return null;
    }

    const isStale =
      result.data.version !== version ||
      Date.now() - result.data.savedAt > MAX_AGE_MS;

    if (isStale) {
      storage.removeItem(storageKey);

      return null;
    }

    return {
      savedAt: result.data.savedAt,
      base: result.data.base,
      data: result.data.data,
    };
  };

  const write = (key: string, base: string, data: T): boolean => {
    const storage = getStorage();

    if (storage === null) return false;

    try {
      storage.setItem(
        getStorageKey(key),
        VersionedDraft.encode({ version, savedAt: Date.now(), base, data }),
      );

      return true;
    } catch (err) {
      console.error('Draft write error:', err);

      return false;
    }
  };

  const remove = (key: string) => {
    getStorage()?.removeItem(getStorageKey(key));
  };

  return { read, write, remove };
}

export function persistDraft<T>(
  options: PersistDraftOptions<T>,
): DraftPersistence {
  if (isServer) return { flush: () => {}, clear: () => {} };

  let timeoutRef: ReturnType<typeof setTimeout> | undefined;
  let pendingKey: string | null = null;

  const flush = () => {
    clearTimeout(timeoutRef);
    timeoutRef = undefined;

    const key = pendingKey;

    pendingKey = null;

    if (key === null) return;

    if (!options.isDirty()) {
      options.store.remove(key);

      return;
    }

    const isWritten = options.store.write(
      key,
      options.base(),
      options.snapshot(),
    );

    if (!isWritten) options.onWriteError?.();
  };

  const schedule = (key: string) => {
    if (pendingKey !== null && pendingKey !== key) flush();

    pendingKey = key;
    timeoutRef ??= setTimeout(flush, WRITE_DELAY_MS);
  };

  const clear = () => {
    clearTimeout(timeoutRef);
    timeoutRef = undefined;
    pendingKey = null;

    const key = options.key();

    if (key !== null) options.store.remove(key);
  };

  onMount(() => {
    createEffect(
      on(
        () => [options.key(), options.snapshot(), options.isDirty()] as const,
        ([key]) => {
          if (key !== null) schedule(key);
        },
      ),
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', flush);

    onCleanup(() => {
      flush();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', flush);
    });
  });

  return { flush, clear };
}
