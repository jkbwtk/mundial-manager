import fs from 'node:fs';
import path, { join } from 'node:path';
import type { RouteDefinition } from '@solidjs/router';
import { generateHydrationScript } from 'solid-js/web';
import { generateSW } from 'workbox-build';
import { render, routes } from '#dist/server/entryServer';
import { logger } from '#shared/logger';
import { arrayFrom } from '#shared/utils';

const template = fs.readFileSync('./dist/client/index.html', 'utf-8');

const mapRoutes = (route: RouteDefinition): RouteDefinition[] => [
  route,
  ...arrayFrom(route.children ?? [])
    .map((child) => ({
      ...child,
      path: path.join(route.path ?? '', child.path ?? ''),
    }))
    .flatMap(mapRoutes),
];

const flatRoutes = routes.flatMap(mapRoutes).filter((route) => route.component);

const trailingSlashRegex = /[\\/]+$/;

const routesToPrerender = flatRoutes
  .map((route) => route.path.replace(trailingSlashRegex, ''))
  .filter((path) => !path.includes('*'));

if (!fs.existsSync('./dist/static')) {
  fs.mkdirSync('./dist/static', { recursive: true });
}

logger.info('Generating %d static pages', routesToPrerender.length, {
  label: ['prerenderPages'],
});

for (const url of routesToPrerender) {
  const rendered = await render(url);

  const head = generateHydrationScript();

  const html = template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', rendered.html ?? '');

  const filePath = join('./dist/static', `${url || 'index'}.html`);

  if (!fs.existsSync(filePath)) {
    const urlParts = url.split(/[\\/]/);
    urlParts.pop();

    const dirPath = join('./dist/static', ...urlParts);

    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }

  fs.writeFileSync(filePath, html);

  logger.debug('Pre-rendered: %s', filePath, {
    label: ['prerenderPages'],
  });
}

logger.info('Regenerating service worker with static HTML files...', {
  label: ['prerenderPages'],
});

const { count, size, warnings } = await generateSW({
  swDest: './dist/client/sw.js',
  globDirectory: './dist/client',
  globPatterns: ['**/*.{js,css,ico,png,svg,gif,woff2,webmanifest}'],
  cleanupOutdatedCaches: true,
  additionalManifestEntries: routesToPrerender.map((url) => ({
    url: url || '/',
    revision: Date.now().toString(),
  })),
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api/],
  skipWaiting: false,
  clientsClaim: false,
  sourcemap: false,
});

if (warnings.length > 0) {
  for (const warning of warnings) {
    logger.warn('SW generation warning: %s', warning, {
      label: ['prerenderPages'],
    });
  }
}

logger.info(
  'Service worker regenerated: %d files, %s KB total',
  count,
  (size / 1024).toFixed(2),
  { label: ['prerenderPages'] },
);
