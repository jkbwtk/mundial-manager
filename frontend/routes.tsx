import { lazy } from 'solid-js';
import type { ExtendedRouteDefinition } from '#frontend/types';
import { DashboardLayout } from '#pages/DashboardLayout';
import { errors, GenericErrorPage } from '#pages/GenericErrorPage';
import Homepage from '#pages/Homepage/Homepage';

const MundialCalculator = lazy(
  () => import('#pages/MundialCalculator/MundialCalculator'),
);
const AdminDashboard = lazy(
  () => import('#pages/AdminDashboard/AdminDashboard'),
);
const SeasonsDashboard = lazy(
  () => import('#pages/SeasonsDashboard/SeasonsDashboard'),
);
const TablesDashboard = lazy(
  () => import('#pages/TablesDashboard/TablesDashboard'),
);
const BallsDashboard = lazy(
  () => import('#pages/BallsDashboard/BallsDashboard'),
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
const ToastTest = lazy(() => import('#pages/ToastTest/ToastTest'));
const PWATest = lazy(() => import('#pages/PWATest/PWATest'));
const DropdownTest = lazy(() => import('#pages/DropdownTest/DropdownTest'));
const SeasonSummaryTest = lazy(
  () => import('#pages/SeasonSummaryTest/SeasonSummaryTest'),
);
const MaterialSymbolTest = lazy(
  () => import('#pages/MaterialSymbolTest/MaterialSymbolTest'),
);
const ChartBuilderTest = lazy(
  () => import('#pages/ChartBuilderTest/ChartBuilderTest'),
);
const FormsTest = lazy(() => import('#pages/FormsTest/FormsTest'));

export const dashboardRoutes: ExtendedRouteDefinition[] = [
  {
    path: '/',
    component: Homepage,
    info: { name: 'Home', icon: 'home' },
  },
  {
    path: '/mundial-calculator',
    component: MundialCalculator,
    info: { name: 'Mundial Calculator', icon: 'timer_play' },
  },
  {
    path: '/admin',
    component: AdminDashboard,
    info: { name: 'Admin', icon: 'admin_panel_settings' },
  },
  {
    path: '/seasons',
    component: SeasonsDashboard,
    info: { name: 'Seasons', icon: 'date_range' },
  },
  {
    path: '/tables',
    component: TablesDashboard,
    info: { name: 'Tables', icon: 'table_restaurant' },
  },
  {
    path: '/balls',
    component: BallsDashboard,
    info: { name: 'Balls', icon: 'sports_soccer' },
  },
];

export const testRoutes: ExtendedRouteDefinition[] = [
  {
    path: '/',
    info: { name: 'Route Map' },
    component: RouteMap,
  },

  {
    path: '/chart-test',
    info: { name: 'Chart Test' },
    component: ChartTest,
  },
  {
    path: '/button-test',
    info: { name: 'Button Test' },
    component: ButtonTest,
  },
  {
    path: '/input-test',
    info: { name: 'Input Test' },
    component: InputTest,
  },
  {
    path: '/sheets-test',
    info: { name: 'Sheets Test' },
    component: SheetsTest,
  },
  {
    path: '/widget-test',
    info: { name: 'Widget Test' },
    component: WidgetTest,
  },
  {
    path: '/iframe-test',
    info: { name: 'Iframe Test' },
    component: IframeTest,
  },
  {
    path: '/modal-test',
    info: { name: 'Modal Test' },
    component: ModalTest,
  },
  {
    path: '/changelog-test',
    info: { name: 'Changelog Test' },
    component: ChangelogTest,
  },
  {
    path: '/user-profile-test',
    info: { name: 'Player Profile Test' },
    component: UserProfileTest,
  },
  {
    path: '/match-timeline-test',
    info: { name: 'Match Timeline Test' },
    component: MatchTimelineTest,
  },
  {
    path: '/created-matches-test',
    info: { name: 'Created Matches Test' },
    component: CreatedMatchesTest,
  },
  {
    path: '/toast-test',
    info: { name: 'Toast Test' },
    component: ToastTest,
  },
  {
    path: '/pwa-test',
    info: { name: 'PWA Test' },
    component: PWATest,
  },
  {
    path: '/dropdown-test',
    info: { name: 'Dropdown Test' },
    component: DropdownTest,
  },
  {
    path: '/season-summary-test',
    info: { name: 'Season Summary Test' },
    component: SeasonSummaryTest,
  },
  {
    path: '/material-symbol-test',
    info: { name: 'Material Symbol Test' },
    component: MaterialSymbolTest,
  },
  {
    path: '/chart-builder-test',
    info: { name: 'Chart Builder Test' },
    component: ChartBuilderTest,
  },
  {
    path: '/forms-test',
    info: { name: 'Forms Test' },
    component: FormsTest,
  },
];

export const routes: ExtendedRouteDefinition[] = [
  {
    path: '',
    component: DashboardLayout,
    children: dashboardRoutes,
    info: { name: 'Dashboard', icon: 'dashboard' },
  },
  {
    path: '/tests',
    info: { name: 'Tests', icon: 'science' },
    children: testRoutes,
  },
  {
    path: '/404',
    info: { name: 'Not Found', public: false },
    component: () => <GenericErrorPage config={errors.pageNotFound} />,
  },
  {
    path: '*404',
    info: { name: 'Not Found', public: false },
    component: () => <GenericErrorPage config={errors.pageNotFound} />,
  },
];
