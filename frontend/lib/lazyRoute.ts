import { createComponent, lazy } from 'solid-js';
import { getRequestEvent, isServer } from 'solid-js/web';
import { reportRequestFailure } from '#flib/network';
import { mergeOptions, type RequiredDefaults, sleep } from '#shared/utils';

type LazyRouteLoader<P extends Record<string, unknown>> = () => Promise<{
  default: Component<P>;
}>;

type LazyRouteGlob = Record<string, () => Promise<unknown>>;

export type LazyRouteComponent<P extends Record<string, unknown>> =
  Component<P> & { preload: LazyRouteLoader<P> };

export type ImportRetryOptions = {
  retries?: number;
  baseDelay?: number; // milliseconds
  importUrl?: (url: string) => Promise<unknown>;
};

const defaultImportRetryOptions: RequiredDefaults<ImportRetryOptions> = {
  retries: 4,
  baseDelay: 1000,
  importUrl: (url) => import(/* @vite-ignore */ url),
};

const RENDERED_MODULES_KEY = 'renderedModules';

const ChunkErrorRegex =
  /dynamically imported module|Importing a module script failed|error loading dynamically/i;
const ModuleUrlRegex =
  /(?:https?:\/\/[^\s'"]+|\/[^\s'"]+)\.(?:m?js|jsx?|tsx?)(?:\?[^\s'"]*)?/;

export class ChunkLoadError extends Error {
  public constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Failed to load a module', {
      cause,
    });

    this.name = 'ChunkLoadError';
  }
}

function withRetryParam(url: string, attempt: number): string {
  const retryUrl = new URL(url, location.href);

  retryUrl.searchParams.set('retry', `${attempt}`);

  return retryUrl.href;
}

function getRequestLocals(): Record<string, unknown> | null {
  const event = getRequestEvent() as
    | { locals?: Record<string, unknown> }
    | undefined;

  return event?.locals ?? null;
}

function registerRenderedModule(module: string): void {
  const locals = getRequestLocals();

  if (locals === null) return;

  const modules =
    (locals[RENDERED_MODULES_KEY] as Set<string> | undefined) ?? new Set();

  modules.add(module);
  locals[RENDERED_MODULES_KEY] = modules;
}

export function getRenderedModules(locals: Record<string, unknown>): string[] {
  const modules = locals[RENDERED_MODULES_KEY] as Set<string> | undefined;

  return [...(modules ?? [])];
}

export function isChunkLoadError(error: unknown): error is Error {
  return (
    error instanceof ChunkLoadError ||
    (error instanceof Error && ChunkErrorRegex.test(error.message))
  );
}

export async function importWithRetry<T>(
  load: () => Promise<T>,
  userOptions: ImportRetryOptions = {},
): Promise<T> {
  const options = mergeOptions(userOptions, defaultImportRetryOptions);

  let failedUrl: string | null = null;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const module =
        failedUrl === null
          ? await load()
          : ((await options.importUrl(
              withRetryParam(failedUrl, attempt),
            )) as T);

      return module;
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;

      if (isServer) throw new ChunkLoadError(err);

      reportRequestFailure();

      if (attempt >= options.retries) throw new ChunkLoadError(err);

      failedUrl ??= err.message.match(ModuleUrlRegex)?.[0] ?? null;

      await sleep(options.baseDelay * 2 ** attempt);
    }
  }
}

function createLazyRoute<P extends Record<string, unknown>>(
  load: LazyRouteLoader<P>,
  module?: string,
): LazyRouteComponent<P> {
  const LazyComponent = lazy(() => importWithRetry(load));

  const RouteComponent = (props: P) => {
    if (isServer && module !== undefined) registerRenderedModule(module);

    return createComponent(LazyComponent, props);
  };

  RouteComponent.preload = LazyComponent.preload;

  return RouteComponent;
}

export function lazyRoute(
  pages: LazyRouteGlob,
): LazyRouteComponent<Record<string, never>>;
export function lazyRoute<P extends Record<string, unknown>>(
  load: LazyRouteLoader<P>,
  module?: string,
): LazyRouteComponent<P>;
export function lazyRoute<P extends Record<string, unknown>>(
  source: LazyRouteGlob | LazyRouteLoader<P>,
  module?: string,
): LazyRouteComponent<P> {
  if (typeof source === 'function') return createLazyRoute(source, module);

  const [page] = Object.entries(source);

  if (page === undefined) {
    throw new Error('No module matched the lazy route glob');
  }

  const [path, load] = page;

  return createLazyRoute(load as LazyRouteLoader<P>, path.slice(1));
}
