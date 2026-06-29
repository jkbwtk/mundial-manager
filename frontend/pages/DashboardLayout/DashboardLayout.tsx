import { Dynamic } from 'solid-js/web';
import { isMobile } from '#flib/utils';
import {
  DashboardDesktopLayout,
  DashboardMobileLayout,
} from '#pages/DashboardLayout';

export const DashboardLayout: ParentComponent = (props) => {
  return (
    <Dynamic
      component={isMobile() ? DashboardMobileLayout : DashboardDesktopLayout}
      {...props}
    />
  );
};

export default DashboardLayout;
