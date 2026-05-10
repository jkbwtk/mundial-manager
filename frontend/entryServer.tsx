import type { AnyRouter } from '@trpc/server';
import { renderToStringAsync } from 'solid-js/web';
import z from 'zod';
import { type FetchEvent, provideRequestEvent } from '#shared/solidSSR';
import App from './App';
import { routes } from './routes';

const responseStatusSchema = z
  .int()
  .min(100)
  .max(599)
  .optional()
  .catch(undefined);

export async function render(
  url: string,
  trpcCaller: ReturnType<AnyRouter['createCaller']>,
  fetchEvent: FetchEvent,
) {
  let status: number | undefined;

  const setResponseStatus = (next: number) => {
    status = responseStatusSchema.safeParse(next).data;
  };

  const html = await provideRequestEvent(fetchEvent, () =>
    renderToStringAsync(() => (
      <App
        url={url}
        ssrProps={{
          setResponseStatus,
          trpcCaller,
        }}
      />
    )),
  );

  return { html, status };
}

export { routes };
