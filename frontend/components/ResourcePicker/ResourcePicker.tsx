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
import { Spinner } from '#components/Spinner';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import style from './ResourcePicker.module.scss';

export interface PickerEntry<T> {
  label: string | JSX.Element;
  value: T;
  loading?: true;
}

export interface ResourcePickerProps<T = unknown, TR = unknown, TE = string> {
  query: (search: string) => Promise<T>;
  transform: (data: T) => Array<TR>;
  toEntry: (data: TR) => PickerEntry<TE>;

  queryById: (id: TE) => Promise<TR>;

  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  anchor?: DropdownAnchor;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];

  value?: TE;
  onChange?: (value?: TE) => void;
}

export const ResourcePicker = <T = unknown, TR = T, TE = string>(
  props: ResourcePickerProps<T, TR, TE>,
) => {
  let ref!: HTMLButtonElement;
  let inputRef!: HTMLInputElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;
  const owner = getOwner();

  const [open, setOpen] = createSignal(false);
  const [searchInput, setSearchInput] = createSignal('');
  const searchInputDebounce = debounce((v: string) => setSearchInput(v), 300);

  const transformedData = async (search: string) => {
    const data = await props.query(search);
    return props.transform(data);
  };

  const [data] = createResource(searchInput, transformedData);

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

  const toEntryWithOwner = (instance: TR): PickerEntry<TE> => {
    const createEntry = () => props.toEntry(instance);
    if (!owner) return createEntry();
    return runWithOwner(owner, createEntry) ?? createEntry();
  };

  const moveActiveIndex = (delta: 1 | -1) => {
    const optionsCount = data.latest?.length ?? 0;
    if (optionsCount === 0) return;

    const currentIndex = activeIndex();
    if (currentIndex < 0) {
      setActiveIndex(delta > 0 ? 0 : optionsCount - 1);
      return;
    }

    setActiveIndex((currentIndex + delta + optionsCount) % optionsCount);
  };

  const handleTriggerDown = (ev: KeyboardEvent) => {
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
        setActiveIndex((data.latest?.length ?? 1) - 1);
        break;
      case 'Enter':
      case ' ': {
        ev.preventDefault();
        const index = activeIndex();
        const option = data.latest?.[index];

        if (option) selectOption(toEntryWithOwner(option));
        break;
      }
      case 'Escape':
        ev.preventDefault();
        closeMenu();
        break;
    }
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
    on([data], () => {
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
          [props.class!]: !!props.class,
          ...(props.classList ?? {}),
        }}
        //@ts-expect-error
        prop:name={props.name}
        prop:value={picked()?.value ?? ''}
      >
        <span class={style.content}>
          <Switch fallback={picked()?.label}>
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
              type="button"
              onPointerUp={(ev) => {
                ev.stopPropagation();
                setPicked(null);
              }}
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
            <For each={data.latest}>
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
          </Suspense>
        </div>
      </AnchoredPopup>
    </>
  );
};
