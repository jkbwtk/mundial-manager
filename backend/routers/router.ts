import { readFile } from 'node:fs/promises';
import compression from 'compression';
import { Router } from 'express';
import sirv from 'sirv';
import { generateHydrationScript } from 'solid-js/web';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';
import { render } from '#dist/server/entryServer';

const maxAge = 365 * 24 * 60 * 60; // 7 days

export async function createRouter() {
  const router = Router();

  const template = await readFile('./dist/client/index.html', 'utf-8');
  const head = generateHydrationScript();

  router.use('/trpc', createTRPCRouter());

  router.use(compression({ level: 9 }));

  router.use(
    '/assets',
    sirv('./dist/client/assets', { extensions: [], maxAge }),
  );

  router.use(
    '/',
    sirv('./dist/client', {
      extensions: ['webmanifest', 'js'],
    }),
  );

  router.get('*splat', async (req, res) => {
    const url = req.originalUrl.replace('/', '');

    const rendered = await render(url);

    const html = template
      .replace('<!--app-head-->', head)
      .replace('<!--app-html-->', rendered.html);

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
  });

  return router;
}
