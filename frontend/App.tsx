/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';

import { ErrorBoundary, isServer, Show, Suspense } from 'solid-js/web';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { DevGrid } from '#components/DevGrid';
import { isDev } from '#flib/utils';
import FatalErrorPage from '#pages/FatalErrorPage/FatalErrorPage';
import { errors, GenericErrorPage } from '#pages/GenericErrorPage';
import { RootLayout } from '#pages/RootLayout';
import { ChangelogProvider } from '#providers/ChangelogProvider';
import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { ModalDispatcher, ModalProvider } from '#providers/ModalProvider';
import { SheetsProvider } from '#providers/SheetsProvider';
import {
  SSRUtilsProvider,
  type SSRUtilsProviderProps,
} from '#providers/SSRUtilsProvider/SSRUtilsProvider';
import { ToastProvider } from '#providers/ToastProvider';
import { routes } from './routes';

export interface AppProps {
  url?: string;
  ssrProps?: SSRUtilsProviderProps;
}

const App: Component<AppProps> = (props) => {
  return (
    <ErrorBoundary fallback={(err) => <FatalErrorPage error={err} />}>
      <SSRUtilsProvider {...props.ssrProps}>
        <ErrorBoundary
          fallback={(err, reset) => (
            <GenericErrorPage
              config={errors.internalError}
              error={err}
              reset={reset}
            />
          )}
        >
          <Suspense>
            <MetaProvider>
              <ConsoleUnitPrototypeProvider>
                <ToastProvider>
                  <SheetsProvider>
                    <ModalProvider>
                      <ChangelogProvider>
                        <ModalDispatcher>
                          <AcrylicBackground />
                          <Show when={isDev()}>
                            <DevGrid />
                          </Show>

                          <Router
                            url={isServer ? props.url : ''}
                            root={RootLayout}
                          >
                            {routes}
                          </Router>
                        </ModalDispatcher>
                      </ChangelogProvider>
                    </ModalProvider>
                  </SheetsProvider>
                </ToastProvider>
              </ConsoleUnitPrototypeProvider>
            </MetaProvider>
          </Suspense>
        </ErrorBoundary>
      </SSRUtilsProvider>
    </ErrorBoundary>
  );
};

export default App;
