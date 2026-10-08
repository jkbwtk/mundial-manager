import {
  createResilientAsync,
  type ResilientAccessor,
} from '#flib/resilientAsync';
import { isPublicRoute } from '#flib/solidHelpers';
import { queryIdentity } from '#flib/trpcCalls';
import type { ExtendedRouteDefinition } from '#frontend/types';
import {
  hasPermissions,
  type PermissionRequirement,
} from '#shared/permissions';
import type { Identity } from '#shared/types/api/identity';

export function useIdentity(): ResilientAccessor<Identity | undefined> {
  return createResilientAsync(queryIdentity);
}

export function useCan(): (required: PermissionRequirement) => boolean {
  const identity = useIdentity();

  return (required) => hasPermissions(identity()?.permissions ?? [], required);
}

export function useIsVisibleRoute(): (
  route: ExtendedRouteDefinition,
) => boolean {
  const can = useCan();

  return (route) =>
    isPublicRoute(route) &&
    (route.info.permission === undefined || can(route.info.permission));
}
