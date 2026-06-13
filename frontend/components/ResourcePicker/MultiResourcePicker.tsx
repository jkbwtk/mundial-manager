import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  getOwner,
  type JSX,
  on,
  onMount,
} from 'solid-js';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  type PickerEntry,
  type PickerQueryMeta,
  ResourcePickerBase,
} from '#components/ResourcePicker';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
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
  let containerRef!: HTMLDivElement;
  let ref!: HTMLButtonElement;

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

  createEffect(
    on(
      [picked],
      ([picked]) => {
        props.onChange?.(picked.map((e) => e.value));

        ref.oninput?.(new InputEvent('input', { bubbles: true }));
      },
      { defer: true },
    ),
  );

  createEffect(
    on([() => props.value], ([value]) => {
      if (value === undefined) return;

      setPicked(value.map((e) => ({ label: '', value: e, loading: true })));

      Promise.all(value.map((v) => props.queryById(v)))
        .then((instances) => instances.map(props.toEntry))
        .then((entries) => {
          setPicked(entries);
        });
    }),
  );

  onMount(() => {
    // @ts-expect-error
    containerRef.setCustomValidity = () => {};
    // @ts-expect-error
    containerRef.reportValidity = () => true;
    // @ts-expect-error
    containerRef.checkValidity = () => true;

    // @ts-expect-error
    applyDirectives(containerRef, props.useDirectives ?? []);
  });

  return (
    <div
      ref={containerRef}
      //@ts-expect-error
      prop:name={props.name}
      prop:value={picked().map((e) => e.value) ?? ''}
    >
      <div class={styles.multiPicker}>
        <For each={picked()}>
          {(entry) => (
            <div class={styles.multiEntry}>
              {entry.label}
              <button
                type="button"
                class={styles.clearButton}
                onClick={() => {
                  setPicked((prev) =>
                    prev.filter((e) => e.value !== entry.value),
                  );
                }}
              >
                <MaterialSymbol
                  interactive
                  color="primary"
                  highlightColor="primary"
                  symbol="delete"
                />
              </button>
            </div>
          )}
        </For>
      </div>

      <Button
        ref={ref}
        id={triggerId}
        class={styles.multiTrigger}
        type="button"
        severity="secondary"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={menuId}
        disabled={props.disabled}
        aria-invalid={props.invalid}
        onClick={toggleOpen}
      >
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
