import { renderToStringAsync } from 'solid-js/web';
import z from 'zod';
import App from '#frontend/App';
import { routes } from '#frontend/routes';
import { provideRequestEvent, type SSRRenderFunction } from '#shared/solidSSR';

const responseStatusSchema = z
  .int()
  .min(100)
  .max(599)
  .optional()
  .catch(undefined);

const titleSchema = z.string().regex(/^[a-zA-Z0-9\s\-_.]+$/);

export const render: SSRRenderFunction = async (
  url,
  trpcCaller,
  fetchEvent,
) => {
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
};

export { routes };
