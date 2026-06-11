import {
  createSignal,
  createUniqueId,
  For,
  getOwner,
  type JSX,
} from 'solid-js';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  type PickerEntry,
  type PickerQueryMeta,
  ResourcePickerBase,
} from '#components/ResourcePicker';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';
import type { PaginatedResponse } from '#shared/zod';
import styles from './ResourcePicker.module.scss';

export interface MultiResourcePickerProps<T, TE> {
  query: (meta?: PickerQueryMeta) => Promise<PaginatedResponse<T>>;
  toEntry: (data: T) => PickerEntry<TE>;

  queryById: (id: TE) => Promise<T>;

  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];

  value?: TE[];
  onChange?: (value: TE[]) => void;
}

export const MultiResourcePicker = <T, TE = unknown>(
  props: MultiResourcePickerProps<T, TE>,
) => {
  let ref!: HTMLButtonElement;
  let clearRef!: HTMLButtonElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;
  const owner = getOwner();

  const [open, setOpen] = createSignal(false);

  const [picked, setPicked] = createSignal<PickerEntry<TE>[]>([]);

  const openMenu = () => {
    setOpen(true);
  };

  const closeMenu = (focusTrigger = false) => {
    setOpen(false);

    if (focusTrigger) {
      ref.focus();
    }

    ref.onblur?.(new FocusEvent('blur', { relatedTarget: ref }));
  };

  const toggleOpen = () => {
    open() ? closeMenu() : openMenu();
  };

  const selectOption = (entry: PickerEntry<TE>) => {
    if (isPicked(entry.value)) {
      setPicked((prev) => prev.filter((e) => e.value !== entry.value));
      closeMenu(true);
      return;
    }

    setPicked((prev) => [...prev, entry]);
    closeMenu(true);
  };

  const isPicked = (value: TE) => {
    return picked().some((e) => e.value === value);
  };

  return (
    <div>
      <div>
        <For each={picked()}>
          {(entry) => (
            <div>
              {entry.label}
              <button
                type="button"
                onClick={() => {
                  setPicked((prev) =>
                    prev.filter((e) => e.value !== entry.value),
                  );
                }}
              >
                <MaterialSymbol symbol="delete" />
              </button>
            </div>
          )}
        </For>
      </div>

      <Button ref={ref} type="button" id={triggerId} onClick={toggleOpen}>
        +
      </Button>

      <ResourcePickerBase
        query={props.query}
        toEntry={props.toEntry}
        menuId={menuId}
        triggerId={triggerId}
        open={open()}
        triggerRef={() => ref}
        onSelect={selectOption}
        onClose={closeMenu}
        isPicked={isPicked}
      />
    </div>
  );
};
