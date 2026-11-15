import { NoHydration, renderToString, renderToStringAsync } from 'solid-js/web';
import z from 'zod';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { getRenderedModules } from '#flib/lazyRoute';
import {
  getThemePhase,
  readThemeCookies,
  resolveTheme,
  ThemeDefinitions,
} from '#flib/themes';
import App from '#frontend/App';
import { routes } from '#frontend/routes';
import { ThemeEnum } from '#frontend/types';
import { GenericErrorPage } from '#pages/GenericErrorPage';
import { SSRUtilsProvider } from '#providers/SSRUtilsProvider/SSRUtilsProvider';
import {
  provideRequestEvent,
  type SSRRenderErrorFunction,
  type SSRRenderFunction,
} from '#shared/solidSSR';
import { getZonedCalendar } from '#shared/timeUtils';

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
  const cookies = fetchEvent.request.header('cookie');

  const themeCookies = readThemeCookies(cookies);
  const now = getZonedCalendar(
    Date.now(),
    themeCookies.themeTimeZone ?? undefined,
  );
  const theme = resolveTheme(themeCookies.theme, now);
  const themePhase = getThemePhase(theme, now);

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
          cookies,
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
    theme,
    themeColor: ThemeDefinitions[theme].browserColor,
    themePhase: themePhase ?? '',
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

  return {
    html,
    title: DEFAULT_TITLE,
    theme: ThemeEnum.DEFAULT,
    themeColor: ThemeDefinitions.DEFAULT.browserColor,
    themePhase: '',
  };
};

export { routes };
