import { renderToStringAsync } from 'solid-js/web';
import App from './App';
import { routes } from './routes';

export async function render(url: string) {
  const html = await renderToStringAsync(() => <App url={url} />);
  return { html };
}

export { routes };
