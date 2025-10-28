import type { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';
import Homepage from '#pages/Homepage/Homepage';
import PageNotFound from '#pages/PageNotFound/PageNotFound';

const RouteMap = lazy(() => import('#pages/RouteMap/RouteMap'));
const ChartTest = lazy(() => import('#pages/ChartTest'));
const ButtonTest = lazy(() => import('#pages/ButtonTest/ButtonTest'));
const InputTest = lazy(() => import('#pages/InputTest/InputTest'));
const SheetsTest = lazy(() => import('#pages/SheetsTest/SheetsTest'));
const WidgetTest = lazy(() => import('#pages/WidgetTest/WidgetTest'));
const IframeTest = lazy(() => import('#pages/IframeTest/IframeTest'));
const ModalTest = lazy(() => import('#pages/ModalTest/ModalTest'));

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
      {
        path: '/modal-test',
        info: { title: 'Mundial Manager - Modal Test' },
        component: ModalTest,
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
