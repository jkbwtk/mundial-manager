import { EventEmitter, on } from 'node:events';

// biome-ignore lint/suspicious/noExplicitAny: yeah
type EventMap<T> = Record<keyof T, any[]>;

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
