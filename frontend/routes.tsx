import type { RouteDefinition } from '@solidjs/router';
import ButtonTest from '#pages/ButtonTest/ButtonTest';
import ChartTest from '#pages/ChartTest';
import Homepage from '#pages/Homepage/Homepage';
import PageNotFound from '#pages/PageNotFound/PageNotFound';
import RouteMap from '#pages/RouteMap/RouteMap';
import { SheetsTest } from '#pages/SheetsTest';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    info: { title: 'Mundial Manager - Home' },
    component: Homepage,
  },
  {
    path: '/tests',
    children: [
      {
        path: '/',
        info: { title: 'Mundial Manager - Route Map' },
        component: RouteMap,
      },
      {
        path: '/chart-test',
        info: { title: 'Mundial Manager - Chart Test' },
        component: ChartTest,
      },
      {
        path: '/button-test',
        info: { title: 'Mundial Manager - Button Test' },
        component: ButtonTest,
      },
      {
        path: '/sheets-test',
        info: { title: 'Mundial Manager - Sheets Test' },
        component: SheetsTest,
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
