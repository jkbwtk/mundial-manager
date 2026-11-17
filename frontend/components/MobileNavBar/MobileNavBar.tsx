import { A, useLocation } from '@solidjs/router';
import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  Match,
  on,
  onCleanup,
  Suspense,
  Switch,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { Breadcrumbs } from '#components/Breadcrumbs';
import { BuildDetails } from '#components/BuildDetails';
import { LiveMatchBadge } from '#components/LiveMatches';
import { LogoMark } from '#components/LogoMark';
import { LogoSmall } from '#components/LogoSmall';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useNotificationSettingsModal } from '#components/NotificationSettingsModal';
import { PermissionGuard } from '#components/PermissionGuard';
import { Sidebar, SidebarButton } from '#components/Sidebar';
import { ThemePicker } from '#components/ThemePicker';
import { ThemeSlot } from '#components/ThemeSlot';
import { Divider } from '#components/Widget';
import { prereleaseBuildInfo } from '#flib/buildInfo';
import { useCan } from '#flib/identity';
import { isDev } from '#flib/utils';
import { routes } from '#frontend/routes';
import { useChangelog } from '#providers/ChangelogProvider';
import type { SupportedMaterialSymbol } from '#shared/materialSymbols';
import {
  MatchRecordingPermissions,
  PermissionEnum,
  type PermissionRequirement,
} from '#shared/permissions';
import style from './MobileNavBar.module.scss';

export interface MobileNavBarProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface MobileNavBarTab {
  href: string;
  label: string;
  symbol: SupportedMaterialSymbol;
  permission: PermissionRequirement;
  record?: boolean;
}

const MobileNavBarTabs: MobileNavBarTab[] = [
  {
    href: '/',
    label: 'Home',
    symbol: 'home',
    permission: PermissionEnum.STATS_READ,
  },
  {
    href: '/matches',
    label: 'Matches',
    symbol: 'gps_fixed',
    permission: PermissionEnum.MATCHES_READ,
  },
  {
    href: '/mundial-calculator',
    label: 'Record',
    symbol: 'timer_play',
    permission: MatchRecordingPermissions,
    record: true,
  },
  {
    href: '/players',
    label: 'Players',
    symbol: 'groups',
    permission: PermissionEnum.PLAYERS_READ,
  },
];

export const MobileNavBar: Component<MobileNavBarProps> = (props) => {
  const can = useCan();
  const location = useLocation();
  const [, { latestVersion, latestCommitHash }] = useChangelog();
  const openNotificationSettings = useNotificationSettingsModal();

  const id = createUniqueId();

  const [open, setOpen] = createSignal(false);

  const toggleMenu = () => setOpen((isOpen) => !isOpen);
  const closeMenu = () => setOpen(false);

  const handleOpenNotificationSettings = () => {
    closeMenu();
    openNotificationSettings();
  };

  createEffect(on(() => location.pathname, closeMenu, { defer: true }));

  createEffect(
    on(open, (isOpen) => {
      if (isServer || !isOpen) return;

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key !== 'Escape') return;

        ev.preventDefault();
        closeMenu();
      };

      document.addEventListener('keydown', handleKeyDown);

      onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
    }),
  );

  return (
    <>
      <header
        classList={{
          [style.container]: true,
          [props.class ?? '']: !!props.class,
          ...(props.classList ?? {}),
        }}
      >
        <div class={style.bar}>
          <LogoMark />
          <Breadcrumbs class={style.breadcrumbs} />
          <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
            <Suspense>
              <LiveMatchBadge />
            </Suspense>
          </PermissionGuard>
        </div>

        <Divider />
      </header>

      <div class={style.statusBar} aria-hidden="true" />

      <nav class={style.tabBar} aria-label="Main">
        <For each={MobileNavBarTabs.filter((tab) => can(tab.permission))}>
          {(tab) => (
            <A
              href={tab.href}
              end={tab.href === '/'}
              classList={{
                'no-style': true,
                [style.tab]: true,
                [style.record]: tab.record === true,
              }}
            >
              <MaterialSymbol symbol={tab.symbol} />
              <span class={style.tabLabel}>{tab.label}</span>
            </A>
          )}
        </For>

        <button
          type="button"
          classList={{
            'no-style': true,
            [style.tab]: true,
            [style.tabOpen]: open(),
          }}
          aria-label="Menu"
          aria-expanded={open()}
          aria-controls={`${id}-drawer`}
          onClick={toggleMenu}
        >
          <MaterialSymbol symbol={open() ? 'close' : 'menu'} />
          <span class={style.tabLabel}>Menu</span>
        </button>
      </nav>

      <div
        aria-hidden="true"
        classList={{
          [style.backdrop]: true,
          [style.open]: open(),
        }}
        onClick={closeMenu}
      />

      <aside
        id={`${id}-drawer`}
        classList={{
          [style.drawer]: true,
          [style.open]: open(),
        }}
      >
        <div class={style.logo}>
          <LogoSmall />
        </div>

        <Divider />

        <Sidebar routes={routes}>
          <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
            <SidebarButton
              symbol="notifications"
              label="Notifications"
              onClick={handleOpenNotificationSettings}
            />
          </PermissionGuard>
        </Sidebar>

        <div class={style.inDevelopment}>
          <ThemeSlot name="sidebar" />
          <ThemePicker />
          <Switch
            fallback={
              <div>
                v{latestVersion()} ({latestCommitHash()})
              </div>
            }
          >
            <Match when={isDev()}>
              <div>Development build</div>
            </Match>
            <Match when={prereleaseBuildInfo()}>
              {(buildInfo) => <BuildDetails buildInfo={buildInfo()} />}
            </Match>
          </Switch>
        </div>
      </aside>
    </>
  );
};
