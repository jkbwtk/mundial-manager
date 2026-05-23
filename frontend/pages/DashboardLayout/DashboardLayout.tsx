import { LogoSmall } from '#components/LogoSmall/LogoSmall';
import { Sidebar } from '#components/Sidebar/Sidebar';
import { Divider } from '#components/Widget';
import { routes } from '#frontend/routes';
import style from './DashboardLayout.module.scss';

export const DashboardLayout: ParentComponent = (props) => {
  return (
    <div class={style.container}>
      <div class={style.logo}>
        <LogoSmall />
      </div>

      <Divider direction="vertical" connect={0b11} />

      <div class={style.info} />

      <Divider class={style.horizontalDivider} />

      <div class={style.nav}>
        <Sidebar routes={routes} />
        <div class={style.inDevelopment}>
          <div>Still in development</div>
        </div>
      </div>

      <Divider direction="vertical" connect={0b11} />

      {props.children}
    </div>
  );
};

export default DashboardLayout;
