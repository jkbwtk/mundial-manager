import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import compression from 'compression';
import Cookies from 'cookies';
import { Router } from 'express';
import helmet from 'helmet';
import sirv from 'sirv';
import { generateHydrationScript } from 'solid-js/web';
import { db } from '#backend/db/database';
import { environment } from '#backend/environment';
import { createMagicRouter } from '#backend/routers/magic/magicRouter';
import { appRouter } from '#backend/routers/trpc/app';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';
import { getCookieSecurity } from '#blib/jwt';
import {
  createErrorMiddleware,
  jwtMiddleware,
  notFoundMiddleware,
  requestLogger,
} from '#blib/middlewares';
import { createModulePreloader } from '#blib/modulePreload';
import { logger } from '#shared/logger';
import { pageErrorScript } from '#shared/pageError';
import {
  createFetchEvent,
  type SSRRenderErrorFunction,
  type SSRRenderFunction,
} from '#shared/solidSSR';

const maxAge = 365 * 24 * 60 * 60; // 7 days

export async function createRouter() {
  const router = Router();

  // @ts-expect-error
  const entryServer = await import('#dist/server/entryServer');
  const render: SSRRenderFunction = entryServer.render;
  const renderError: SSRRenderErrorFunction = entryServer.renderError;

  const template = await readFile(
    join(environment.DIST_DIR, 'client/index.html'),
    'utf-8',
  );
  const head = generateHydrationScript();
  const getModulePreloads = await createModulePreloader(
    join(environment.DIST_DIR, 'client/.vite/manifest.json'),
  );

  const allowedRootExtensions = ['webmanifest', 'js', 'ico', 'png'];
  const allowedWithDots = allowedRootExtensions.map((ext) => `.${ext}`);

  router.use(
    helmet({
      xDownloadOptions: false,
      xXssProtection: false,
      contentSecurityPolicy: {
        directives: {
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          mediaSrc: ["'self'", 'data:'],
          frameSrc: [environment.VITE_CALCULATOR_URL],
        },
      },
    }),
  );

  router.use('/trpc', createTRPCRouter());

  router.use(compression({ level: 9 }));

  router.use(requestLogger);

  router.use('/magic', await createMagicRouter());

  router.use(
    '/assets',
    sirv(join(environment.DIST_DIR, 'client/assets'), {
      extensions: [],
      immutable: true,
      maxAge,
    }),
    notFoundMiddleware,
  );

  router.use(
    '/',
    sirv(join(environment.DIST_DIR, 'client'), {
      extensions: allowedRootExtensions,
    }),
    (req, res, next) => {
      if (allowedWithDots.some((ext) => req.path.endsWith(ext))) {
        notFoundMiddleware(req, res, next);
      } else {
        next();
      }
    },
  );

  router.get('*splat', jwtMiddleware, async (req, res) => {
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

    const fetchEvent = createFetchEvent(req, res);

    const rendered = await render(url, trpcCaller, fetchEvent);

    const html = template
      .replace('<!--app-title-->', rendered.title)
      .replace('<!--app-head-->', head)
      .replace('</head>', `${getModulePreloads(rendered.modules)}</head>`)
      .replace('<!--app-html-->', () => rendered.html);

    const status = rendered.status ?? 200;

    res.status(status).set({ 'Content-Type': 'text/html' }).send(html);
  });

  router.use(
    createErrorMiddleware({
      renderErrorPage: async (pageError) => {
        const rendered = renderError(pageError);

        return template
          .replace('<!--app-title-->', rendered.title)
          .replace('<!--app-head-->', pageErrorScript)
          .replace('<!--app-html-->', () => rendered.html);
      },
      exposeDetails: !environment.PRODUCTION,
    }),
  );

  return router;
}
