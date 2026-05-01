import path from 'node:path';
import type { RouteDefinition } from '@solidjs/router';
import { generateSW } from 'workbox-build';
import { routes } from '#dist/server/entryServer';
import { logger } from '#shared/logger';
import { arrayFrom } from '#shared/utils';

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
