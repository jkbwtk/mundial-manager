import fs from 'node:fs';
import path, { join } from 'node:path';
import type { RouteDefinition } from '@solidjs/router';
import { generateHydrationScript } from 'solid-js/web';
import { render, routes } from '#dist/server/entryServer';
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

const trailingSlashRegex = /\/+$/;

const routesToPrerender = flatRoutes
  .map((route) => route.path.replace(trailingSlashRegex, ''))
  .filter((path) => !path.includes('*'));

if (!fs.existsSync('./dist/static')) {
  fs.mkdirSync('./dist/static', { recursive: true });
}

for (const url of routesToPrerender) {
  const rendered = await render(url);

  const head = generateHydrationScript();

  const html = template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', rendered.html ?? '');

  const filePath = join('./dist/static', `${url || 'index'}.html`);

  if (!fs.existsSync(filePath)) {
    const urlParts = url.split('/');
    urlParts.pop();

    const dirPath = join('./dist/static', ...urlParts);

    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }

  fs.writeFileSync(filePath, html);
  console.log('pre-rendered:', filePath);
}
