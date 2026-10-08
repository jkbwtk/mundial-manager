import { type JSX, Show } from 'solid-js';
import { useIdentity } from '#flib/identity';
import {
  hasPermissions,
  type PermissionRequirement,
} from '#shared/permissions';

export interface PermissionGuardProps {
  permission: PermissionRequirement;
  fallback?: JSX.Element;
}

export const PermissionGuard: ParentComponent<PermissionGuardProps> = (
  props,
) => {
  const identity = useIdentity();

  return (
    <Show when={identity()}>
      {(current) => (
        <Show
          when={hasPermissions(current().permissions, props.permission)}
          fallback={props.fallback}
        >
          {props.children}
        </Show>
      )}
    </Show>
  );
};
