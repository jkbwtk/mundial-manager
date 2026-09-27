import { lazyRoute } from '#flib/lazyRoute';
import type { ExtendedRouteDefinition } from '#frontend/types';
import { errors, GenericErrorPage } from '#pages/GenericErrorPage';
import { preloadMatchEventsDashboard } from '#preloaders/MatchEventsDashboard';

const Homepage = lazyRoute(import.meta.glob('#pages/Homepage/Homepage.tsx'));
const MundialCalculator = lazyRoute(
  import.meta.glob('#pages/MundialCalculator/MundialCalculator.tsx'),
);
const AdminDashboard = lazyRoute(
  import.meta.glob('#pages/AdminDashboard/AdminDashboard.tsx'),
);
const SeasonsDashboard = lazyRoute(
  import.meta.glob('#pages/SeasonsDashboard/SeasonsDashboard.tsx'),
);
const TablesDashboard = lazyRoute(
  import.meta.glob('#pages/TablesDashboard/TablesDashboard.tsx'),
);
const BallsDashboard = lazyRoute(
  import.meta.glob('#pages/BallsDashboard/BallsDashboard.tsx'),
);
const PlayersDashboard = lazyRoute(
  import.meta.glob('#pages/PlayersDashboard/PlayersDashboard.tsx'),
);
const MatchesDashboard = lazyRoute(
  import.meta.glob('#pages/MatchesDashboard/MatchesDashboard.tsx'),
);
const MatchEventsDashboard = lazyRoute(
  import.meta.glob('#pages/MatchEventsDashboard/MatchEventsDashboard.tsx'),
);

const RouteMap = lazyRoute(import.meta.glob('#pages/RouteMap/RouteMap.tsx'));
const ChartTest = lazyRoute(import.meta.glob('#pages/ChartTest/ChartTest.tsx'));
const ButtonTest = lazyRoute(
  import.meta.glob('#pages/ButtonTest/ButtonTest.tsx'),
);
const InputTest = lazyRoute(import.meta.glob('#pages/InputTest/InputTest.tsx'));
const SheetsTest = lazyRoute(
  import.meta.glob('#pages/SheetsTest/SheetsTest.tsx'),
);
const WidgetTest = lazyRoute(
  import.meta.glob('#pages/WidgetTest/WidgetTest.tsx'),
);
const IframeTest = lazyRoute(
  import.meta.glob('#pages/IframeTest/IframeTest.tsx'),
);
const ModalTest = lazyRoute(import.meta.glob('#pages/ModalTest/ModalTest.tsx'));
const ChangelogTest = lazyRoute(
  import.meta.glob('#pages/ChangelogTest/ChangelogTest.tsx'),
);
const UserProfileTest = lazyRoute(
  import.meta.glob('#pages/PlayerProfileTest/PlayerProfileTest.tsx'),
);
const MatchTimelineTest = lazyRoute(
  import.meta.glob('#pages/MatchTimelineTest/MatchTimelineTest.tsx'),
);
const CreatedMatchesTest = lazyRoute(
  import.meta.glob('#pages/CreatedMatchesTest/CreatedMatchesTest.tsx'),
);
const ToastTest = lazyRoute(import.meta.glob('#pages/ToastTest/ToastTest.tsx'));
const PWATest = lazyRoute(import.meta.glob('#pages/PWATest/PWATest.tsx'));
const DropdownTest = lazyRoute(
  import.meta.glob('#pages/DropdownTest/DropdownTest.tsx'),
);
const SeasonSummaryTest = lazyRoute(
  import.meta.glob('#pages/SeasonSummaryTest/SeasonSummaryTest.tsx'),
);
const MaterialSymbolTest = lazyRoute(
  import.meta.glob('#pages/MaterialSymbolTest/MaterialSymbolTest.tsx'),
);
const ChartBuilderTest = lazyRoute(
  import.meta.glob('#pages/ChartBuilderTest/ChartBuilderTest.tsx'),
);
const FormsTest = lazyRoute(import.meta.glob('#pages/FormsTest/FormsTest.tsx'));
const BlankTestPage = lazyRoute(
  import.meta.glob('#pages/BlankTestPage/BlankTestPage.tsx'),
);
const ResourcePickerTest = lazyRoute(
  import.meta.glob('#pages/ResourcePickerTest/ResourcePickerTest.tsx'),
);

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
  {
    path: '/players',
    component: PlayersDashboard,
    info: { name: 'Players', icon: 'groups' },
  },
  {
    path: '/matches',
    component: MatchesDashboard,
    info: { name: 'Matches', icon: 'gps_fixed' },
  },
  {
    path: '/match-events/:matchUuid',
    component: MatchEventsDashboard,
    preload: preloadMatchEventsDashboard,
    info: { name: 'Match Events', icon: 'atr', public: false },
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
  {
    path: '/blank-test',
    info: { name: 'Blank Test Page' },
    component: BlankTestPage,
  },
  {
    path: '/resource-picker-test',
    info: { name: 'Resource Picker Test' },
    component: ResourcePickerTest,
  },
];

export const routes: ExtendedRouteDefinition[] = [
  {
    path: '',
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
