import { useBeforeLeave } from '@solidjs/router';
import { type Accessor, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { mergeOptions, type RequiredDefaults } from '#shared/utils';

export type UnsavedChangesOptions = {
  message?: string;
  onDiscard?: () => void;
};

const defaultUnsavedChangesOptions: RequiredDefaults<UnsavedChangesOptions> = {
  message: 'Discard unsaved changes?',
  onDiscard: () => {},
};

const dirtySources = new Map<symbol, Accessor<boolean>>();

let unloadGuardInstalled = false;

function installUnloadGuard(): void {
  if (unloadGuardInstalled) return;

  unloadGuardInstalled = true;

  window.addEventListener('beforeunload', (ev) => {
    if (!hasUnsavedChanges()) return;

    ev.preventDefault();
    ev.returnValue = '';
  });
}

export function hasUnsavedChanges(): boolean {
  return [...dirtySources.values()].some((isDirty) => isDirty());
}

export function useUnsavedChanges(
  isDirty: Accessor<boolean>,
  userOptions: UnsavedChangesOptions = {},
): void {
  if (isServer) return;

  const options = mergeOptions(userOptions, defaultUnsavedChangesOptions);
  const id = Symbol('unsavedChanges');

  dirtySources.set(id, isDirty);
  installUnloadGuard();

  onCleanup(() => dirtySources.delete(id));

  try {
    useBeforeLeave((ev) => {
      if (!isDirty() || ev.defaultPrevented) return;

      ev.preventDefault();

      if (!window.confirm(options.message)) return;

      options.onDiscard();
      ev.retry(true);
    });
  } catch {}
}
