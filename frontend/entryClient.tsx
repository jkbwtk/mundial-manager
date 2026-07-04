import { hydrate } from 'solid-js/web';
import App from '#frontend/App';

hydrate(() => <App />, document.getElementById('root') as HTMLElement);
