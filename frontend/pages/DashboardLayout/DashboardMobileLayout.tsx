import { Suspense } from 'solid-js';

export const DashboardMobileLayout: ParentComponent = (props) => {
  return <Suspense>{props.children}</Suspense>;
};
