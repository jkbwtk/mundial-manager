import { Suspense } from 'solid-js';
import { MobileNavBar } from '#components/MobileNavBar';
import style from './DashboardLayout.module.scss';

export const DashboardMobileLayout: ParentComponent = (props) => {
  return (
    <div class={style.mobileContainer}>
      <MobileNavBar />

      <Suspense>{props.children}</Suspense>
    </div>
  );
};
