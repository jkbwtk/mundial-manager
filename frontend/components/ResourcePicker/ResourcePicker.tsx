import { debounce } from '@solid-primitives/scheduled';
import {
  batch,
  createEffect,
  createResource,
  createSignal,
  createUniqueId,
  For,
  getOwner,
  type JSX,
  Match,
  on,
  onMount,
  runWithOwner,
  Suspense,
  Switch,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import type { DropdownAnchor } from '#components/Dropdown';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Paginator } from '#components/Paginator';
import { Spinner } from '#components/Spinner';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import type { PaginatedResponse } from '#shared/zod';
import style from './ResourcePicker.module.scss';

export interface PickerEntry<T> {
  label: string | JSX.Element;
  value: T;
  loading?: true;
}

export interface ResourcePickerQueryMeta {
  pagination?: {
    limit: number;
    offset: number;
  };
  search?: string;
}

export interface ResourcePickerProps<T = unknown, TE = string> {
  query: (meta?: ResourcePickerQueryMeta) => Promise<PaginatedResponse<T>>;
  toEntry: (data: T) => PickerEntry<TE>;

  queryById: (id: TE) => Promise<T>;

  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  anchor?: DropdownAnchor;
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
  let inputRef!: HTMLInputElement;
  let clearRef!: HTMLButtonElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;
  const owner = getOwner();

  const [open, setOpen] = createSignal(false);

  const [limit, setLimit] = createSignal(10);
  const [page, setPage] = createSignal(0);
  const [searchInput, setSearchInput] = createSignal('');
  const searchInputDebounce = debounce((v: string) => setSearchInput(v), 300);

  const queryMetaProp = (): ResourcePickerQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    search: searchInput().trim(),
  });

  const [resp] = createResource(queryMetaProp, props.query);

  const [picked, setPicked] = createSignal<PickerEntry<TE> | null>(null);
  const [activeIndex, setActiveIndex] = createSignal(-1);

  const openMenu = () => {
    batch(() => {
      setOpen(true);
      setSearchInput('');
    });

    requestAnimationFrame(() => {
      inputRef.focus();
    });
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
    setPicked(entry);
    closeMenu(true);
  };

  const toEntryWithOwner = (instance: T): PickerEntry<TE> => {
    const createEntry = () => props.toEntry(instance);
    if (!owner) return createEntry();
    return runWithOwner(owner, createEntry) ?? createEntry();
  };

  const moveActiveIndex = (delta: 1 | -1) => {
    const optionsCount = resp.latest?.data.length ?? 0;
    if (optionsCount === 0) return;

    const currentIndex = activeIndex();
    if (currentIndex < 0) {
      setActiveIndex(delta > 0 ? 0 : optionsCount - 1);
      return;
    }

    setActiveIndex((currentIndex + delta + optionsCount) % optionsCount);
  };

  const handleTriggerDown = (ev: KeyboardEvent) => {
    if (clearRef && ev.target === clearRef) return;

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

  const handleMenuKeyDown = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        moveActiveIndex(1);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        moveActiveIndex(-1);
        break;
      case 'Home':
        ev.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        ev.preventDefault();
        setActiveIndex((resp.latest?.data.length ?? 1) - 1);
        break;
      case 'Enter':
      case ' ': {
        ev.preventDefault();
        const index = activeIndex();
        const option = resp.latest?.data[index];

        if (option) selectOption(toEntryWithOwner(option));
        break;
      }
      case 'Escape':
        ev.preventDefault();
        closeMenu();
        break;
    }
  };

  const handleClearButtonClick = (ev: Event) => {
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

  createEffect(
    on([resp], () => {
      setActiveIndex(-1);
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
          <Switch fallback={picked()?.label ?? props.placeholder}>
            <Match when={picked()?.loading}>
              <Spinner />
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

      <AnchoredPopup
        id={menuId}
        open={open()}
        class={style.menu}
        aria-labelledby={triggerId}
        triggerRef={() => ref}
        onClickOutside={closeMenu}
        onKeyDown={handleMenuKeyDown}
        matchTriggerWidth
      >
        <Input
          ref={inputRef}
          class={style.input}
          value={searchInput()}
          placeholder="Search..."
          autocomplete="off"
          onInput={(ev) => {
            const target = ev.target as HTMLInputElement;
            searchInputDebounce(target.value);
          }}
        >
          <MaterialSymbol symbol="search" />
        </Input>

        <div class={style.optionContainer}>
          <Suspense fallback={<Spinner />}>
            <For each={resp.latest?.data}>
              {(instance, index) => {
                const entry = props.toEntry(instance);

                return (
                  <button
                    role="option"
                    type="button"
                    classList={{
                      [style.option]: true,
                      [style.active]: index() === activeIndex(),
                      [style.picked]: entry.value === picked()?.value,
                    }}
                    onPointerUp={() => selectOption(entry)}
                    onPointerEnter={() => setActiveIndex(index())}
                  >
                    {entry.label}
                  </button>
                );
              }}
            </For>

            <Paginator
              class={style.paginator}
              total={resp.latest?.total ?? 0}
              limit={limit()}
              setLimit={setLimit}
              page={page()}
              setPage={setPage}
            />
          </Suspense>
        </div>
      </AnchoredPopup>
    </>
  );
};
