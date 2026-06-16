import {
  createEffect,
  createSignal,
  createUniqueId,
  getOwner,
  type JSX,
  Match,
  on,
  onMount,
  runWithOwner,
  Switch,
} from 'solid-js';
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
import style from './ResourcePicker.module.scss';

export interface ResourcePickerProps<T = unknown, TE = string> {
  query: (meta?: PickerQueryMeta) => Promise<PaginatedResponse<T>>;
  toEntry: (data: T) => PickerEntry<TE>;

  queryById: (id: TE) => Promise<T>;

  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  class?: string;
  placeholder?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];

  value?: TE;
  onChange?: (value?: TE) => void;
}

export const ResourcePicker = <T, TE = string>(
  props: ResourcePickerProps<T, TE>,
) => {
  let ref!: HTMLButtonElement;
  let clearRef!: HTMLButtonElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;
  const owner = getOwner();

  const [open, setOpen] = createSignal(false);

  const [picked, setPicked] = createSignal<PickerEntry<TE> | null>(null);

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

  const toggleOpen = (ev: PointerEvent) => {
    if (
      ev.target instanceof HTMLElement &&
      clearRef &&
      clearRef.contains(ev.target)
    ) {
      return;
    }

    open() ? closeMenu() : openMenu();
  };

  const selectOption = (entry: PickerEntry<TE>) => {
    setPicked(entry);
    closeMenu(true);
  };

  const isPicked = (value: TE) => {
    return value === picked()?.value;
  };

  const toEntryWithOwner = (instance: T): PickerEntry<TE> => {
    const createEntry = () => props.toEntry(instance);
    if (!owner) return createEntry();
    return runWithOwner(owner, createEntry) ?? createEntry();
  };

  const handleTriggerDown = (ev: KeyboardEvent) => {
    if (
      ev.target instanceof HTMLElement &&
      clearRef &&
      clearRef.contains(ev.target)
    ) {
      return;
    }

    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        openMenu();
        break;
      case 'ArrowUp':
        ev.preventDefault();
        openMenu();
        break;
      case 'Enter':
      case ' ':
        if (open() === false) {
          ev.preventDefault();
          openMenu();
        }
        break;
    }
  };

  const handleClearButtonClick = (ev: Event) => {
    ev.preventDefault();
    ev.stopPropagation();
    setPicked(null);

    ref.focus();
  };

  createEffect(
    on(
      [picked],
      ([picked]) => {
        props.onChange?.(picked?.value);

        ref.oninput?.(new InputEvent('input', { bubbles: true }));
      },
      { defer: true },
    ),
  );

  createEffect(
    on([() => props.value], ([value]) => {
      if (value === undefined) {
        setPicked(null);
        return;
      }

      setPicked({ label: '', value, loading: true });

      props.queryById(value).then((instance) => {
        if (picked()?.value !== value) return;

        const entry = toEntryWithOwner(instance);
        setPicked(entry);
      });
    }),
  );

  onMount(() => {
    ref.setCustomValidity = () => {};
    ref.reportValidity = () => true;

    // @ts-expect-error
    applyDirectives(ref, props.useDirectives ?? []);
  });

  return (
    <>
      <button
        ref={ref}
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={menuId}
        onPointerUp={toggleOpen}
        disabled={props.disabled}
        aria-invalid={props.invalid}
        onKeyDown={handleTriggerDown}
        classList={{
          [style.picker]: true,
          [style.invalid]: props.invalid,
          [style.placeholder]: !picked() && !!props.placeholder,
          [props.class!]: !!props.class,
          ...(props.classList ?? {}),
        }}
        //@ts-expect-error
        prop:name={props.name}
        prop:value={picked()?.value ?? ''}
      >
        <span class={style.content}>
          <Switch fallback={<TextMarquee>{props.placeholder}</TextMarquee>}>
            <Match when={picked()?.loading}>
              <Spinner />
            </Match>

            <Match when={picked()?.label !== undefined}>
              <TextMarquee>{picked()?.label}</TextMarquee>
            </Match>

            <Match
              when={picked()?.value !== undefined && picked()?.value !== null}
            >
              <TextMarquee>{String(picked()?.value)}</TextMarquee>
            </Match>
          </Switch>
        </span>

        <Switch>
          <Match when={picked() === null}>
            <span aria-hidden="true">
              <MaterialSymbol
                color="primary"
                symbol={open() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              />
            </span>
          </Match>

          <Match when={picked() !== null}>
            <button
              ref={clearRef}
              type="button"
              class={style.clearButton}
              onClick={handleClearButtonClick}
              aria-label="Clear selection"
            >
              <MaterialSymbol
                interactive
                color="primary"
                highlightColor="primary"
                symbol="delete"
              />
            </button>
          </Match>
        </Switch>
      </button>

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
    </>
  );
};
