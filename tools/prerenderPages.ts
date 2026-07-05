import path from 'node:path';
import type { RouteDefinition } from '@solidjs/router';
import { logger } from '#shared/logger';
import { arrayFrom } from '#shared/utils';

// @ts-expect-error
const routes: RouteDefinition[] = (await import('#dist/server/entryServer'))
  .routes;

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

logger.debug('Routes to prerender: %o', routesToPrerender, {
  label: ['prerenderPages'],
});
