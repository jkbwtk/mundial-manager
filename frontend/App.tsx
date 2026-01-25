/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';

import { isServer, Show, Suspense } from 'solid-js/web';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { DevGrid } from '#components/DevGrid';
import { PWAInitializer } from '#components/PWAInitializer';
import { isDev } from '#flib/utils';
import { ChangelogProvider } from '#providers/ChangelogProvider';
import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { ModalDispatcher, ModalProvider } from '#providers/ModalProvider';
import { SheetsProvider } from '#providers/SheetsProvider';
import { ToastProvider } from '#providers/ToastProvider';
import { TRPCProvider } from '#providers/TRPCProvider';
import { routes } from './routes';

const App: Component<{ url?: string }> = (props) => {
  return (
    <MetaProvider>
      <ConsoleUnitPrototypeProvider>
        <ToastProvider>
          <TRPCProvider>
            <SheetsProvider>
              <ModalProvider>
                <ChangelogProvider>
                  <ModalDispatcher>
                    {/* Pre rendering fails without <Suspense>, dev server works fine without it */}
                    <Suspense>
                      <AcrylicBackground />
                      <Show when={isDev()}>
                        <DevGrid />
                      </Show>

                      <PWAInitializer />

                      <Router url={isServer ? props.url : ''}>{routes}</Router>
                    </Suspense>
                  </ModalDispatcher>
                </ChangelogProvider>
              </ModalProvider>
            </SheetsProvider>
          </TRPCProvider>
        </ToastProvider>
      </ConsoleUnitPrototypeProvider>
    </MetaProvider>
  );
};

export default App;
