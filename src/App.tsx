/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { Show, Suspense, isServer } from 'solid-js/web';
import { DevGrid } from '#components/DevGrid';
import { isDev } from '#lib/utils';
import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { TRPCProvider } from '#providers/TRPCProvider';
import { routes } from './routes';

const App: Component<{ url?: string }> = (props) => {
  return (
    <MetaProvider>
      <ConsoleUnitPrototypeProvider>
        <TRPCProvider>
          {/* Pre rendering fails without <Suspense>, dev server works fine without it */}
          <Suspense>
            <Show when={isDev()}>
              <DevGrid />
            </Show>

            <Router url={isServer ? props.url : ''}>{routes}</Router>
          </Suspense>
        </TRPCProvider>
      </ConsoleUnitPrototypeProvider>
    </MetaProvider>
  );
};

export default App;
