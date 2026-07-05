import { AsyncLocalStorage } from 'node:async_hooks';
import type { AnyRouter } from '@trpc/server';
import type { Request, Response } from 'express';
import { RequestContext } from 'solid-js/web';

export interface FetchEvent {
  request: Request;
  response: Response;
  clientAddress?: string;
  locals: Record<string, unknown>;
  nativeEvent: { req: Request; res: Response };
}

export interface SSRRenderReturn {
  html: string;
  status?: number;
  title: string;
}

export type SSRRenderFunction = (
  url: string,
  trpcCaller: ReturnType<AnyRouter['createCaller']>,
  fetchEvent: FetchEvent,
) => Promise<SSRRenderReturn>;

export function provideRequestEvent<T, R>(
  init: T,
  callback: (...args: unknown[]) => Promise<R>,
) {
  // @ts-expect-error
  let storage = globalThis[RequestContext] as
    | AsyncLocalStorage<unknown>
    | undefined;

  if (storage === undefined) {
    storage = new AsyncLocalStorage();

    // @ts-expect-error
    globalThis[RequestContext] = storage;
  }

  return storage.run(init, callback);
}

export function createFetchEvent(req: Request, res: Response): FetchEvent {
  return {
    request: req,
    response: res,
    locals: {},
    nativeEvent: { req, res },
  };
}
