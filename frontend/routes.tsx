import type { RouteDefinition } from '@solidjs/router';
import { lazy } from 'solid-js';
import Homepage from '#pages/Homepage/Homepage';
import PageNotFound from '#pages/PageNotFound/PageNotFound';

const MundialCalculator = lazy(
  () => import('#pages/MundialCalculator/MundialCalculator'),
);

const RouteMap = lazy(() => import('#pages/RouteMap/RouteMap'));
const ChartTest = lazy(() => import('#pages/ChartTest'));
const ButtonTest = lazy(() => import('#pages/ButtonTest/ButtonTest'));
const InputTest = lazy(() => import('#pages/InputTest/InputTest'));
const SheetsTest = lazy(() => import('#pages/SheetsTest/SheetsTest'));
const WidgetTest = lazy(() => import('#pages/WidgetTest/WidgetTest'));
const IframeTest = lazy(() => import('#pages/IframeTest/IframeTest'));
const ModalTest = lazy(() => import('#pages/ModalTest/ModalTest'));
const ChangelogTest = lazy(() => import('#pages/ChangelogTest/ChangelogTest'));
const UserProfileTest = lazy(
  () => import('#pages/PlayerProfileTest/PlayerProfileTest'),
);
const MatchTimelineTest = lazy(
  () => import('#pages/MatchTimelineTest/MatchTimelineTest'),
);
const CreatedMatchesTest = lazy(
  () => import('#pages/CreatedMatchesTest/CreatedMatchesTest'),
);

export const routes: RouteDefinition[] = [
  {
    path: '/',
    info: { title: 'Mundial Manager - Home' },
    component: Homepage,
  },
  {
    path: '/mundial-calculator',
    info: { title: 'Mundial Manager - Mundial Calculator' },
    component: MundialCalculator,
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
      {
        path: '/changelog-test',
        info: { title: 'Mundial Manager - Changelog Test' },
        component: ChangelogTest,
      },
      {
        path: '/user-profile-test',
        info: { title: 'Mundial Manager - Player Profile Test' },
        component: UserProfileTest,
      },
      {
        path: '/match-timeline-test',
        info: { title: 'Mundial Manager - Match Timeline Test' },
        component: MatchTimelineTest,
      },
      {
        path: '/created-matches-test',
        info: { title: 'Mundial Manager - Created Matches Test' },
        component: CreatedMatchesTest,
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
