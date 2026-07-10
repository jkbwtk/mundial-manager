import { Suspense } from 'solid-js';
import { MobileNavBar } from '#components/MobileNavBar';
import style from './DashboardLayout.module.scss';

export const DashboardMobileLayout: ParentComponent = (props) => {
  return (
    <div class={style.mobileContainer}>
      <Suspense>{props.children}</Suspense>

      <MobileNavBar class={style.mobileNav} />
    </div>
  );
};
