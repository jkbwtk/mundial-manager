import type { RouteDefinition } from '@solidjs/router';
import ButtonTest from '#pages/ButtonTest/ButtonTest';
import ChartTest from '#pages/ChartTest';
import Homepage from '#pages/Homepage/Homepage';
import IframeTest from '#pages/IframeTest/IframeTest';
import { InputTest } from '#pages/InputTest';
import PageNotFound from '#pages/PageNotFound/PageNotFound';
import RouteMap from '#pages/RouteMap/RouteMap';
import { SheetsTest } from '#pages/SheetsTest';
import WidgetTest from '#pages/WidgetTest/WidgetTest';

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
        path: '/input-test',
        info: { title: 'Mundial Manager - Input Test' },
        component: InputTest,
      },
      {
        path: '/sheets-test',
        info: { title: 'Mundial Manager - Sheets Test' },
        component: SheetsTest,
      },
      {
        path: '/widget-test',
        info: { title: 'Mundial Manager - Widget Test' },
        component: WidgetTest,
      },
      {
        path: '/iframe-test',
        info: { title: 'Mundial Manager - Iframe Test' },
        component: IframeTest,
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
