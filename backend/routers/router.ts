import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import compression from 'compression';
import { Router } from 'express';
import helmet from 'helmet';
import sirv from 'sirv';
import { generateHydrationScript } from 'solid-js/web';
import { environment } from '#backend/environment';
import { notFoundMiddleware, requestLogger } from '#backend/middlewares';
import { createMagicRouter } from '#backend/routers/magic/magicRouter';
import { createTRPCRouter } from '#backend/routers/trpc/trpcRouter';
import { ExpressStack } from '#blib/ExpressStack';
import { render } from '#dist/server/entryServer';

const maxAge = 365 * 24 * 60 * 60; // 7 days

export async function createRouter() {
  const router = Router();

  const template = await readFile(
    join(environment.DIST_DIR, 'client/index.html'),
    'utf-8',
  );
  const head = generateHydrationScript();

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

  router.get(
    '*splat',
    new ExpressStack()
      .use(async (req, res) => {
        const url = req.originalUrl.replace('/', '');

        const rendered = await render(url);

        const html = template
          .replace('<!--app-head-->', head)
          .replace('<!--app-html-->', rendered.html);

        const status = rendered.status ?? 200;

        res.status(status).set({ 'Content-Type': 'text/html' }).send(html);
      })
      .unwrap(),
  );

  return router;
}
