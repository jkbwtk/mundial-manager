import type { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';

import PageNotFound from '#pages/PageNotFound/PageNotFound';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    info: { title: 'Mundial Manager - Home' },
    component: lazy(() => import('#pages/Homepage/Homepage')),
  },
  {
    path: '/tests',
    children: [
      {
        path: '',
        info: { title: 'Mundial Manager - Route Map' },
        component: lazy(() => import('#pages/RouteMap/RouteMap')),
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
        path: '/sheets-test',
        info: { title: 'Mundial Manager - Sheets Test' },
        component: lazy(() => import('#pages/SheetsTest/SheetsTest')),
      },
    ],
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
