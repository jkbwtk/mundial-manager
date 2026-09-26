import { hydrate } from 'solid-js/web';
import App from '#frontend/App';
import { isPageError } from '#shared/pageError';

if (!isPageError()) {
  hydrate(() => <App />, document.getElementById('root') as HTMLElement);
}
