import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { mergeOptions, type RequiredDefaults } from '#shared/utils';

export type TimeoutFetchOptions = {
  queryTimeout?: number; // milliseconds
  mutationTimeout?: number; // milliseconds
  idleTimeout?: number; // milliseconds
  fetch?: typeof fetch;
};

export const QUERY_TIMEOUT_MS = 12_000;
export const MUTATION_TIMEOUT_MS = 30_000;
export const BODY_IDLE_TIMEOUT_MS = 15_000;

const defaultTimeoutFetchOptions: RequiredDefaults<TimeoutFetchOptions> = {
  queryTimeout: QUERY_TIMEOUT_MS,
  mutationTimeout: MUTATION_TIMEOUT_MS,
  idleTimeout: BODY_IDLE_TIMEOUT_MS,
  fetch: (input, init) => globalThis.fetch(input, init),
};

const [online, setOnline] = createSignal(true);

const reconnectListeners = new Set<() => void>();

export class RequestTimeoutError extends Error {
  public constructor(message: string) {
    super(message);

    this.name = 'RequestTimeoutError';
  }
}

export class UnexpectedResponseError extends TypeError {
  public constructor(message: string) {
    super(message);

    this.name = 'UnexpectedResponseError';
  }
}

export const isOnline = online;

export function onReconnect(listener: () => void): () => void {
  reconnectListeners.add(listener);

  return () => reconnectListeners.delete(listener);
}

export function reportRequestSuccess(): void {
  if (online()) return;

  setOnline(true);

  for (const listener of reconnectListeners) {
    listener();
  }
}

export function reportRequestFailure(): void {
  setOnline(false);
}

if (!isServer) {
  window.addEventListener('offline', reportRequestFailure);
  window.addEventListener('online', reportRequestSuccess);
}

function combineSignals(signals: AbortSignal[]): AbortSignal {
  if ('any' in AbortSignal) return AbortSignal.any(signals);

  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);

      break;
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
  }

  return controller.signal;
}

function watchResponseBody(
  response: Response,
  controller: AbortController,
  signal: AbortSignal,
  idleTimeout: number,
): Response {
  if (response.body === null) return response;

  let timeoutRef: ReturnType<typeof setTimeout> | undefined;

  const restartTimeout = () => {
    clearTimeout(timeoutRef);

    timeoutRef = setTimeout(() => {
      reportRequestFailure();
      controller.abort(
        new RequestTimeoutError(`Response stalled for ${idleTimeout}ms`),
      );
    }, idleTimeout);
  };

  const watchdog = new TransformStream<Uint8Array, Uint8Array>({
    transform: (chunk, stream) => {
      restartTimeout();
      stream.enqueue(chunk);
    },
    flush: () => clearTimeout(timeoutRef),
  });

  restartTimeout();

  signal.addEventListener('abort', () => clearTimeout(timeoutRef), {
    once: true,
  });

  return new Response(response.body.pipeThrough(watchdog), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export function createTimeoutFetch(userOptions: TimeoutFetchOptions = {}) {
  const options = mergeOptions(userOptions, defaultTimeoutFetchOptions);

  return async (
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    const controller = new AbortController();
    const signal = init.signal
      ? combineSignals([init.signal, controller.signal])
      : controller.signal;

    const method = (init.method ?? 'GET').toUpperCase();
    const timeout =
      method === 'GET' ? options.queryTimeout : options.mutationTimeout;

    const timeoutRef = setTimeout(
      () =>
        controller.abort(
          new RequestTimeoutError(`No response within ${timeout}ms`),
        ),
      timeout,
    );

    let response: Response;

    try {
      response = await options.fetch(input, { ...init, signal });
    } catch (err) {
      if (init.signal?.aborted) throw err;

      reportRequestFailure();

      throw controller.signal.aborted ? controller.signal.reason : err;
    } finally {
      clearTimeout(timeoutRef);
    }

    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('json')) {
      reportRequestFailure();
      controller.abort();

      throw new UnexpectedResponseError(
        `Unexpected response (${response.status}, ${contentType || 'no content type'})`,
      );
    }

    reportRequestSuccess();

    return watchResponseBody(response, controller, signal, options.idleTimeout);
  };
}
