import { A } from '@solidjs/router';
import { LogoSmall } from '#components/LogoSmall/LogoSmall';
import { Divider } from '#components/Widget';
import { isMobile } from '#flib/utils';
import style from './DashboardLayout.module.scss';

export const DashboardLayout: ParentComponent = (props) => {
  console.log(isMobile());

  return (
    <div class={style.container}>
      <div class={style.logo}>
        <LogoSmall />
      </div>

      <Divider direction="vertical" connect={0b11} />

      <div class={style.info} />

      <Divider class={style.horizontalDivider} />

      <div class={style.nav}>
        <div class={style.inDevelopment}>
          <div>Still in development</div>
          Test pages -{'>'} <A href="/tests">link</A>
        </div>
      </div>

      <Divider direction="vertical" connect={0b11} />

      {props.children}
    </div>
  );
};

export default DashboardLayout;
