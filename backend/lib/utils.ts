import { EventEmitter, on } from 'node:events';
import type { Server } from 'node:http';

// biome-ignore lint/suspicious/noExplicitAny: yeah
type EventMap<T> = Record<keyof T, any[]>;

const KEEP_ALIVE_TIMEOUT_MS = 65_000;

export class TypedEventEmitter<T extends EventMap<T>> extends EventEmitter<T> {
  toIterable<TEventName extends keyof T & string>(
    eventName: TEventName,
    options?: NonNullable<Parameters<typeof on>[2]>,
  ): AsyncIterable<T[TEventName]> {
    return on(this as EventEmitter, eventName, options) as AsyncIterable<
      T[TEventName]
    >;
  }
}

export function applyKeepAliveTimeout(server: Server): Server {
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 1_000;

  return server;
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
