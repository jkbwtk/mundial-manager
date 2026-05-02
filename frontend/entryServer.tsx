import { renderToStringAsync } from 'solid-js/web';
import z from 'zod';
import App from './App';
import { routes } from './routes';

const statusSchema = z.int().min(100).max(599).optional().catch(undefined);

export async function render(url: string) {
  let status: number | undefined;

  const setStatus = (next: number) => {
    status = statusSchema.safeParse(next).data;
  };

  const html = await renderToStringAsync(() => (
    <App url={url} setStatus={setStatus} />
  ));
  return { html, status };
}

export { routes };
