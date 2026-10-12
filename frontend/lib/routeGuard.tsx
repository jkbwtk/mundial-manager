import type { RouteSectionProps } from '@solidjs/router';
import { PermissionGuard } from '#components/PermissionGuard';
import type { ExtendedRouteDefinition } from '#frontend/types';

export function guardRoute(
  route: ExtendedRouteDefinition,
  Fallback: Component,
): ExtendedRouteDefinition {
  const children = route.children?.map((child) => guardRoute(child, Fallback));
  const permission = route.info.permission;

  if (permission === undefined) return { ...route, children };

  const Page =
    route.component ?? ((props: RouteSectionProps) => props.children);

  const GuardedPage = (props: RouteSectionProps) => (
    <PermissionGuard permission={permission} fallback={<Fallback />}>
      <Page {...props} />
    </PermissionGuard>
  );

  return {
    ...route,
    children,
    component: Object.assign(GuardedPage, {
      preload: 'preload' in Page ? Page.preload : undefined,
    }),
  };
}
