/* @refresh reload */
import { MetaProvider } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { Show, Suspense, isServer } from 'solid-js/web';
import { DevGrid } from '#components/DevGrid';
import { isDev } from '#flib/utils';

import { ConsoleUnitPrototypeProvider } from '#providers/ConsoleUnitPrototypeProvider';
import { SheetsProvider } from '#providers/SheetsProvider';
import { TRPCProvider } from '#providers/TRPCProvider';
import { routes } from './routes';

import 'highlight.js/styles/gml.min.css';

hljs.registerLanguage('json', json);

const App: Component<{ url?: string }> = (props) => {
  return (
    <MetaProvider>
      <ConsoleUnitPrototypeProvider>
        <TRPCProvider>
          <SheetsProvider>
            {/* Pre rendering fails without <Suspense>, dev server works fine without it */}
            <Suspense>
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
