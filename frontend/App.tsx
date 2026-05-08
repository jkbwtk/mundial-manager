/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';

import { ErrorBoundary, isServer, Show, Suspense } from 'solid-js/web';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { DevGrid } from '#components/DevGrid';
import { PWAInitializer } from '#components/PWAInitializer';
import { isDev } from '#flib/utils';
import { errors, GenericErrorPage } from '#pages/GenericErrorPage';
import { ChangelogProvider } from '#providers/ChangelogProvider';
import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { ModalDispatcher, ModalProvider } from '#providers/ModalProvider';
import { SheetsProvider } from '#providers/SheetsProvider';
import {
  SSRUtilsProvider,
  type SSRUtilsProviderProps,
} from '#providers/SSRUtilsProvider/SSRUtilsProvider';
import { ToastProvider } from '#providers/ToastProvider';
import { TRPCProvider } from '#providers/TRPCProvider';
import { routes } from './routes';

export interface AppProps {
  url?: string;
  ssrProps?: SSRUtilsProviderProps;
}

const App: Component<AppProps> = (props) => {
  return (
    <SSRUtilsProvider {...props.ssrProps}>
      <ErrorBoundary
        fallback={<GenericErrorPage config={errors.internalError} />}
      >
        <Suspense>
          <MetaProvider>
            <ConsoleUnitPrototypeProvider>
              <ToastProvider>
                <TRPCProvider>
                  <SheetsProvider>
                    <ModalProvider>
                      <ChangelogProvider>
                        <ModalDispatcher>
                          <AcrylicBackground />
                          <Show when={isDev()}>
                            <DevGrid />
                          </Show>

                          <PWAInitializer />

                          <Router url={isServer ? props.url : ''}>
                            {routes}
                          </Router>
                        </ModalDispatcher>
                      </ChangelogProvider>
                    </ModalProvider>
                  </SheetsProvider>
                </TRPCProvider>
              </ToastProvider>
            </ConsoleUnitPrototypeProvider>
          </MetaProvider>
        </Suspense>
      </ErrorBoundary>
    </SSRUtilsProvider>
  );
};

export default App;
