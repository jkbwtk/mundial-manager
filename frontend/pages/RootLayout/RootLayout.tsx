import { createEffect, createMemo } from 'solid-js';
import { isServer } from 'solid-js/web';
import { ConnectionStatus } from '#components/ConnectionStatus';
import { RouteLoadingBar } from '#components/RouteLoadingBar';
import { useCurrentExtendedMatches } from '#flib/solidHelpers';
import { DashboardLayout } from '#pages/DashboardLayout';
import { useSSRUtils } from '#providers/SSRUtilsProvider';
import { RouteErrorBoundary } from './RouteErrorBoundary';

export const RootLayout: ParentComponent = (props) => {
  const routeMatches = useCurrentExtendedMatches();
  const [, { setTitle }] = useSSRUtils();

  const title = createMemo(() => {
    const currentMatch = routeMatches().at(-1);

    if (currentMatch?.route.info.title) {
      return currentMatch.route.info.title;
    }

    if (currentMatch?.route.info.name) {
      return `Mundial Manager - ${currentMatch.route.info.name}`;
    }

    return 'Mundial Manager';
  });

  if (isServer) {
    setTitle(title());
  }

  createEffect(() => {
    document.title = title();
  });

  return (
    <>
      <RouteLoadingBar />
      <ConnectionStatus />
      <DashboardLayout>
        <RouteErrorBoundary>{props.children}</RouteErrorBoundary>
      </DashboardLayout>
    </>
  );
};
