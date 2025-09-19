import { createHash } from 'node:crypto';
import { arrayFrom, mergeOptions, type RequiredDefaults } from '#shared/utils';

export type CacheOptions = {
  maxSize?: number;
  ttl?: number;
};

export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  overflows: number;
  expiries: number;
}

const defaultCacheOptions: RequiredDefaults<CacheOptions> = {
  maxSize: 1_000,
  ttl: 60_000,
};

const defaultCacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  overflows: 0,
  expiries: 0,
};

const NotFound = Symbol('NotFound');

type NotFound = typeof NotFound;

export class Cache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();

  private options: Required<CacheOptions>;

  private _stats: CacheStats = structuredClone(defaultCacheStats);

  constructor(userOptions: CacheOptions = {}) {
    this.options = mergeOptions(userOptions, defaultCacheOptions);
  }

  public getKey(args: unknown): string {
    const target = arrayFrom(args);

    const serialized = JSON.stringify(target).split('').toSorted().join('');

    const hash = createHash('sha256');

    hash.update(serialized);

    return hash.digest('hex');
  }

  public get(args: unknown): T | NotFound {
    const key = this.getKey(args);
    const entry = this.cache.get(key);

    if (!entry) {
      this._stats.misses += 1;

      return NotFound;
    }

    if (Date.now() > entry.expiry) {
      this._stats.expiries += 1;

      this.cache.delete(key);

      return NotFound;
    }

    this._stats.hits += 1;

    return entry.value;
  }

  public set(args: unknown, value: T): void {
    const key = this.getKey(args);
    const expiry = Date.now() + this.options.ttl;

    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;

      if (oldestKey) {
        this._stats.overflows += 1;

        this.cache.delete(oldestKey);
      } else {
        throw new Error('Cache is full, but no oldest key found.');
      }
    }

    this.cache.set(key, { value, expiry });
  }

  public clear(): void {
    this.cache.clear();
  }

  public has(args: unknown): boolean {
    const key = this.getKey(args);
    return this.cache.has(key);
  }

  public delete(args: unknown): boolean {
    const key = this.getKey(args);
    return this.cache.delete(key);
  }

  public clearStats(): void {
    this._stats = structuredClone(defaultCacheStats);
  }

  public get size(): number {
    return this.cache.size;
  }

  public get stats(): CacheStats {
    return structuredClone(this._stats);
  }
}

export function AsyncCached(userOptions: CacheOptions = {}) {
  const cache = new Cache(userOptions);

  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return function factory(originalMethod: any) {
    // biome-ignore lint/suspicious/noExplicitAny: yeah
    const cachedMethod = async function (this: any, ...args: unknown[]) {
      const cachedValue = cache.get(args);

      if (cachedValue !== NotFound) {
        return cachedValue;
      }

      const result = await originalMethod.call(this, ...args);

      cache.set(args, result);

      return result;
    };

    cachedMethod.cache = cache;
    cachedMethod.originalMethod = originalMethod;

    return cachedMethod;
  };
}

export function clearCache(method: unknown): void {
  if (
    method &&
    typeof method === 'function' &&
    'cache' in method &&
    method.cache instanceof Cache
  ) {
    method.cache.clear();
  } else {
    throw new Error('Method does not have a cache to clear.');
  }
}

export function getCacheSize(method: unknown): number {
  if (
    method &&
    typeof method === 'function' &&
    'cache' in method &&
    method.cache instanceof Cache
  ) {
    return method.cache.size;
  }
  throw new Error('Method does not have a cache to get size from.');
}

export function getCacheStats(method: unknown): CacheStats {
  if (
    method &&
    typeof method === 'function' &&
    'cache' in method &&
    method.cache instanceof Cache
  ) {
    return method.cache.stats;
  }

  throw new Error('Method does not have a cache to get stats from.');
}

export function clearCacheStats(method: unknown): void {
  if (
    method &&
    typeof method === 'function' &&
    'cache' in method &&
    method.cache instanceof Cache
  ) {
    method.cache.clearStats();
  } else {
    throw new Error('Method does not have a cache to clear stats from.');
  }
}

export function checkIfCached<T>(method: T): method is T & { cache: Cache } {
  if (
    method &&
    typeof method === 'function' &&
    'cache' in method &&
    method.cache instanceof Cache
  ) {
    return true;
  }

  return false;
}

// biome-ignore lint/suspicious/noExplicitAny: yeah
export function bypassCache<T extends (...args: any[]) => any>(method: T): T {
  if (
    method &&
    typeof method === 'function' &&
    'originalMethod' in method &&
    typeof method.originalMethod === 'function'
  ) {
    return method.originalMethod as T;
  }

  return method as T;
}
