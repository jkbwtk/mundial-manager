import { readFile } from 'node:fs/promises';
import Cookies from 'cookies';
import { Router } from 'express';
import { generateHydrationScript } from 'solid-js/web';
import { createServer } from 'vite';
import { db } from '#backend/db/database';
import { createMagicRouter } from '#backend/routers/magic/magicRouter';
import { appRouter } from '#backend/routers/trpc/app';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';
import { getCookieSecurity } from '#blib/jwt';
import {
  createErrorMiddleware,
  jwtMiddleware,
  requestLogger,
} from '#blib/middlewares';
import { logger } from '#shared/logger';
import { pageErrorScript } from '#shared/pageError';
import {
  createFetchEvent,
  type SSRRenderErrorFunction,
  type SSRRenderFunction,
} from '#shared/solidSSR';

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

  devRouter.use('*splat', jwtMiddleware, async (req, res) => {
    const url = req.originalUrl;

    const trpcCaller = appRouter.createCaller(
      {
        cookies: new Cookies(req, res),
        cookieSecurity: getCookieSecurity(req),
        // @ts-expect-error
        jwt: Promise.resolve(req.jwt ?? null),
        db,
      },
      {
        onError: (opts) => {
          logger.error('Error during TRPC call', {
            label: ['ssr', opts.path],
            error: opts.error,
          });
        },
      },
    );

    try {
      const transformedTemplate = await vite.transformIndexHtml(url, template);
      const render: SSRRenderFunction = (
        await vite.ssrLoadModule('/frontend/entryServer.tsx')
      ).render;

      const fetchEvent = createFetchEvent(req, res);

      const rendered = await render(url, trpcCaller, fetchEvent);

      const html = transformedTemplate
        .replace('<!--app-title-->', rendered.title)
        .replace('<!--app-head-->', generateHydrationScript())
        .replace('<!--app-html-->', () => rendered.html);

      const status = rendered.status ?? 200;

      res.status(status).set({ 'Content-Type': 'text/html' }).send(html);
    } catch (err) {
      if (err instanceof Error) vite.ssrFixStacktrace(err);

      throw err;
    }
  });

  devRouter.use(
    createErrorMiddleware({
      renderErrorPage: async (pageError) => {
        const transformedTemplate = await vite.transformIndexHtml(
          '/',
          template,
        );
        const renderError: SSRRenderErrorFunction = (
          await vite.ssrLoadModule('/frontend/entryServer.tsx')
        ).renderError;

        const rendered = renderError(pageError);

        return transformedTemplate
          .replace('<!--app-title-->', rendered.title)
          .replace('<!--app-head-->', pageErrorScript)
          .replace('<!--app-html-->', () => rendered.html);
      },
      exposeDetails: true,
    }),
  );

  return devRouter;
}
