import { Match, Suspense, Switch } from 'solid-js';
import { Breadcrumbs } from '#components/Breadcrumbs';
import { BuildDetails } from '#components/BuildDetails';
import { LiveMatchTicker } from '#components/LiveMatches';
import { LogoSmall } from '#components/LogoSmall';
import { useNotificationSettingsModal } from '#components/NotificationSettingsModal';
import { PermissionGuard } from '#components/PermissionGuard';
import { Sidebar, SidebarButton } from '#components/Sidebar';
import { Divider } from '#components/Widget';
import { getBuildInfo } from '#flib/buildInfo';
import { isDev } from '#flib/utils';
import { routes } from '#frontend/routes';
import { BuildChannelEnum } from '#frontend/types';
import { useChangelog } from '#providers/ChangelogProvider';
import { PermissionEnum } from '#shared/permissions';
import style from './DashboardLayout.module.scss';

export const DashboardDesktopLayout: ParentComponent = (props) => {
  const [, { latestVersion, latestCommitHash }] = useChangelog();
  const openNotificationSettings = useNotificationSettingsModal();

  const prereleaseBuildInfo = () => {
    const buildInfo = getBuildInfo();

    if (buildInfo?.channel === BuildChannelEnum.RELEASE) {
      return null;
    }

    return buildInfo;
  };

  return (
    <div class={style.desktopContainer}>
      <div class={style.logo}>
        <LogoSmall />
      </div>

      <Divider direction="vertical" connect={0b11} />

      <div class={style.info}>
        <Breadcrumbs class={style.breadcrumbs} />
        <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
          <Suspense>
            <LiveMatchTicker class={style.ticker} />
          </Suspense>
        </PermissionGuard>
      </div>

      <Divider class={style.horizontalDivider} />

      <div class={style.nav}>
        <Sidebar routes={routes}>
          <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
            <SidebarButton
              symbol="notifications"
              label="Notifications"
              onClick={openNotificationSettings}
            />
          </PermissionGuard>
        </Sidebar>
        <div class={style.inDevelopment}>
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
      </div>

      <Divider direction="vertical" connect={0b11} />

      <Suspense>{props.children}</Suspense>
    </div>
  );
};
