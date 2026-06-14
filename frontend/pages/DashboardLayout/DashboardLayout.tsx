import { Match, Suspense, Switch } from 'solid-js';
import { Breadcrumbs } from '#components/Breadcrumbs';
import { LogoSmall } from '#components/LogoSmall/LogoSmall';
import { Sidebar } from '#components/Sidebar/Sidebar';
import { Divider } from '#components/Widget';
import { isDev } from '#flib/utils';
import { routes } from '#frontend/routes';
import { useChangelog } from '#providers/ChangelogProvider';
import style from './DashboardLayout.module.scss';

export const DashboardLayout: ParentComponent = (props) => {
  const [, { latestVersion, latestCommitHash }] = useChangelog();

  return (
    <div class={style.container}>
      <div class={style.logo}>
        <LogoSmall />
      </div>

      <Divider direction="vertical" connect={0b11} />

      <div class={style.info}>
        <Breadcrumbs class={style.breadcrumbs} />
      </div>

      <Divider class={style.horizontalDivider} />

      <div class={style.nav}>
        <Sidebar routes={routes} />
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
          </Switch>
        </div>
      </div>

      <Divider direction="vertical" connect={0b11} />

      <Suspense>{props.children}</Suspense>
    </div>
  );
};

export default DashboardLayout;
