import { A, type RouteSectionProps, useLocation } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { AnchorButton } from '#components/Button';
import { DesktopOnly } from '#components/DesktopOnly';
import { MobileOnly } from '#components/MobileOnly';
import { StatsPeriodBar } from '#components/StatsPeriodBar';
import { customWidgetType, Widget } from '#components/Widget';
import { useStatsFeed } from '#flib/statsFeed';
import { isMobile } from '#flib/utils';
import { preloadHomepagePeriod } from '#preloaders/Homepage';
import { preloadRatingsPagePeriod } from '#preloaders/RatingsPage';
import { StatsPeriodProvider } from '#providers/StatsPeriodProvider';
import type { StatsPeriod } from '#shared/types/api/stats';
import style from './HomeLayout.module.scss';

const HomeTabs = [
  { path: '/', label: 'Overview' },
  { path: '/charts', label: 'Charts' },
  { path: '/ratings', label: 'Ratings' },
];

const NavWidget = customWidgetType('nav');

const PERIODLESS_PATHS = ['/charts'];

const PeriodPrefetchers: Record<string, (period: StatsPeriod) => void> = {
  '/': preloadHomepagePeriod,
  '/ratings': preloadRatingsPagePeriod,
};

export const HomeLayout: Component<RouteSectionProps> = (props) => {
  const location = useLocation();

  const hasPeriod = () => !PERIODLESS_PATHS.includes(location.pathname);

  const getTabHref = (path: string) => `${path}${location.search}`;
  const isActiveTab = (path: string) => location.pathname === path;

  const prefetch = (period: StatsPeriod) =>
    PeriodPrefetchers[location.pathname]?.(period);

  useStatsFeed();

  return (
    <StatsPeriodProvider>
      <div
        classList={{
          [style.container]: true,
          [style.documentScroll]: isMobile(),
        }}
      >
        <DesktopOnly>
          <Widget class={style.header}>
            <nav class={style.tabs}>
              <For each={HomeTabs}>
                {(tab) => (
                  <AnchorButton
                    href={getTabHref(tab.path)}
                    severity={isActiveTab(tab.path) ? 'primary' : 'secondary'}
                  >
                    {tab.label}
                  </AnchorButton>
                )}
              </For>
            </nav>

            <Show when={hasPeriod()}>
              <StatsPeriodBar class={style.periodBar} onPrefetch={prefetch} />
            </Show>
          </Widget>
        </DesktopOnly>

        <main class={style.content}>
          {props.children}

          <MobileOnly>
            <div class={style.mobileControls}>
              <NavWidget
                class={style.tabRule}
                topLeftLabels={HomeTabs.map((tab) => (
                  <A
                    href={getTabHref(tab.path)}
                    classList={{
                      'no-style': true,
                      [style.tab]: true,
                      [style.active]: isActiveTab(tab.path),
                    }}
                  >
                    {tab.label}
                  </A>
                ))}
                centerLabels
              />

              <Show when={hasPeriod()}>
                <StatsPeriodBar onPrefetch={prefetch} />
              </Show>
            </div>
          </MobileOnly>
        </main>
      </div>
    </StatsPeriodProvider>
  );
};

export default HomeLayout;
