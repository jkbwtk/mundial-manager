import { readFile } from 'node:fs/promises';
import { Router } from 'express';
import { generateHydrationScript } from 'solid-js/web';
import { createServer } from 'vite';
import { requestLogger } from '#backend/middlewares';
import { createMagicRouter } from '#backend/routers/magic/magicRouter';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';
import { logger } from '#shared/logger';

export async function createDevRouter() {
  const devRouter = Router();

  const template = await readFile('./index.html', 'utf-8');

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  devRouter.use(vite.middlewares);

  devRouter.use('/trpc', createTRPCRouter());

  devRouter.use(requestLogger);

  devRouter.use('/magic', await createMagicRouter());

  devRouter.use('*splat', async (req, res, next) => {
    const url = req.originalUrl.replace('/', '');

    try {
      const transformedTemplate = await vite.transformIndexHtml(url, template);
      const render = (await vite.ssrLoadModule('/frontend/entryServer.tsx'))
        .render;

      const rendered = await render(url);

      const head = (rendered.head ?? '') + generateHydrationScript();

      const html = transformedTemplate
        .replace('<!--app-head-->', head)
        .replace('<!--app-html-->', rendered.html ?? '');

      const status = rendered.status ?? 200;

      res.status(status).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (err) {
      if (err instanceof Error) {
        vite.ssrFixStacktrace(err);
      }

      logger.error('Error during SSR', {
        label: ['dev-server'],
        error: err,
      });

      next(err);
    }
  });

  return devRouter;
}
