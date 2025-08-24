import fs from 'node:fs/promises';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import express from 'express';
import { generateHydrationScript } from 'solid-js/web';
import { createServer } from 'vite';
import { appRouter } from '../src/lib/trpc';
import { environment } from './constants.js';

const app = express();
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

app.use(vite.middlewares);

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  }),
);

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace('/', '');

    const template = await fs.readFile('./index.html', 'utf-8');
    const transformedTemplate = await vite.transformIndexHtml(url, template);
    const render = (await vite.ssrLoadModule('/src/entryServer.tsx')).render;

    const rendered = await render(url);

    const head = (rendered.head ?? '') + generateHydrationScript();

    const html = transformedTemplate
      .replace('<!--app-head-->', head)
      .replace('<!--app-html-->', rendered.html ?? '');

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  } catch (e) {
    if (e instanceof Error) {
      // vite.ssrFixStacktrace(e);
      // console.log(e.stack);
      // res.status(500).end(e.stack);
    }
  }
});

app.listen(environment.WEB_PORT, () => {
  console.log(`Server started at http://localhost:${environment.WEB_PORT}`);
});

process.on('SIGINT', () => {
  process.exit();
});
