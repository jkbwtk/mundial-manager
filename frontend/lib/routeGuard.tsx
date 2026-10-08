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

  return {
    ...route,
    children,
    component: (props: RouteSectionProps) => (
      <PermissionGuard permission={permission} fallback={<Fallback />}>
        <Page {...props} />
      </PermissionGuard>
    ),
  };
}
