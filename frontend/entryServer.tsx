import { NoHydration, renderToString, renderToStringAsync } from 'solid-js/web';
import z from 'zod';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { getRenderedModules } from '#flib/lazyRoute';
import App from '#frontend/App';
import { routes } from '#frontend/routes';
import { GenericErrorPage } from '#pages/GenericErrorPage';
import { SSRUtilsProvider } from '#providers/SSRUtilsProvider/SSRUtilsProvider';
import {
  provideRequestEvent,
  type SSRRenderErrorFunction,
  type SSRRenderFunction,
} from '#shared/solidSSR';

const DEFAULT_TITLE = 'Mundial Manager';

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
  let title = DEFAULT_TITLE;

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

  return {
    html,
    status,
    title,
    modules: getRenderedModules(fetchEvent.locals),
  };
};

export const renderError: SSRRenderErrorFunction = (pageError) => {
  const html = renderToString(() => (
    <NoHydration>
      <SSRUtilsProvider>
        <AcrylicBackground />
        <GenericErrorPage config={pageError} error={pageError.error} />
      </SSRUtilsProvider>
    </NoHydration>
  ));

  return { html, title: DEFAULT_TITLE };
};

export { routes };
