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

const titleSchema = z.string().regex(/^[a-zA-Z0-9\s\-_.]+$/);

export async function render(
  url: string,
  trpcCaller: ReturnType<AnyRouter['createCaller']>,
  fetchEvent: FetchEvent,
) {
  let status: number | undefined;
  let title = 'Mundial Manager';

  const userAgent = fetchEvent.request.header('user-agent');

  const setResponseStatus = (next: number) => {
    status = responseStatusSchema.safeParse(next).data;
  };

  const setTitle = (next: string) => {
    const data = titleSchema.safeParse(next);
    if (data.success) {
      title = data.data;
    }
  };

  const html = await provideRequestEvent(fetchEvent, () =>
    renderToStringAsync(() => (
      <App
        url={url}
        ssrProps={{
          setResponseStatus,
          setTitle,
          trpcCaller,
          userAgent,
        }}
      />
    )),
  );

  return { html, status, title };
}

export { routes };
