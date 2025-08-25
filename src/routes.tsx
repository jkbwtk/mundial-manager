import type { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';

import PageNotFound from '#pages/PageNotFound/PageNotFound';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    info: { title: 'Mundial Manager - Home' },
    component: lazy(() => import('#pages/Index/Index.tsx')),
  },
  {
    path: '/chart-test',
    info: { title: 'Mundial Manager - Chart Test' },
    component: lazy(() => import('#pages/ChartTest')),
  },
  {
    path: '/button-test',
    info: { title: 'Mundial Manager - Button Test' },
    component: lazy(() => import('#pages/ButtonTest/ButtonTest')),
  },
  {
    path: '/404',
    component: () => <PageNotFound />,
  },
  {
    path: '*',
    component: () => <PageNotFound />,
  },
];
