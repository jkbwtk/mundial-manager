/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';

import { isServer, Show, Suspense } from 'solid-js/web';
import { AcrylicBackground } from '#components/AcrylicBackground';
import { DevGrid } from '#components/DevGrid';
import { isDev } from '#flib/utils';
import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { SheetsProvider } from '#providers/SheetsProvider';
import { TRPCProvider } from '#providers/TRPCProvider';
import { routes } from './routes';

const App: Component<{ url?: string }> = (props) => {
  return (
    <MetaProvider>
      <ConsoleUnitPrototypeProvider>
        <TRPCProvider>
          <SheetsProvider>
            {/* Pre rendering fails without <Suspense>, dev server works fine without it */}
            <Suspense>
              <AcrylicBackground />
              <Show when={isDev()}>
                <DevGrid />
              </Show>

              <Router url={isServer ? props.url : ''}>{routes}</Router>
            </Suspense>
          </SheetsProvider>
        </TRPCProvider>
      </ConsoleUnitPrototypeProvider>
    </MetaProvider>
  );
};

export default App;
