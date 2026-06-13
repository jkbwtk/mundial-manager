import {
  createEffect,
  createSignal,
  createUniqueId,
  For,
  getOwner,
  type JSX,
  Match,
  on,
  onMount,
  runWithOwner,
  Show,
  Switch,
} from 'solid-js';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  type PickerEntry,
  type PickerQueryMeta,
  ResourcePickerBase,
} from '#components/ResourcePicker';
import { Spinner } from '#components/Spinner';
import { TextMarquee } from '#components/TextMarquee';
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

  const toEntryWithOwner = (instance: T): PickerEntry<TE> => {
    const createEntry = () => props.toEntry(instance);
    if (!owner) return createEntry();
    return runWithOwner(owner, createEntry) ?? createEntry();
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
        .then((instances) => instances.map(toEntryWithOwner))
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
      classList={{
        [styles.multiContainer]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      //@ts-expect-error
      prop:name={props.name}
      prop:value={picked().map((e) => e.value) ?? ''}
    >
      <Show when={picked().length > 0}>
        <div class={styles.multiPicker}>
          <For each={picked()}>
            {(entry) => (
              <div class={styles.multiEntry}>
                <span class={styles.multiEntryLabel}>
                  <Switch>
                    <Match when={entry.loading}>
                      <Spinner />
                    </Match>

                    <Match when={entry.label}>
                      <TextMarquee>{entry.label}</TextMarquee>
                    </Match>

                    <Match when={entry.value}>
                      <TextMarquee>{String(entry.value)}</TextMarquee>
                    </Match>
                  </Switch>
                </span>

                <button
                  type="button"
                  class={styles.clearButton}
                  disabled={props.disabled}
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
      </Show>

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
