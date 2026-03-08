import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  on,
  onCleanup,
  Show,
  splitProps,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { TextMarquee } from '#components/TextMarquee';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { arrayFrom } from '#shared/utils';
import style from './Dropdown.module.scss';

export interface DropdownOption<T = string> {
  label: string;
  value: T;
}

export type DropdownAnchor = 'left' | 'middle' | 'right';

type DropdownCommonProps<T> = {
  options: DropdownOption<T>[];
  disabled?: boolean;
  ariaLabel?: string;
  anchor?: DropdownAnchor;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

export type DropdownPropsSingle<T = string> = DropdownCommonProps<T> & {
  multiple?: false;
  value: T;
  onChange?: (val: NoInfer<T>) => void;
};

export type DropdownPropsMultiple<T = string> = DropdownCommonProps<T> & {
  multiple: true;
  value: T[];
  onChange?: (val: NoInfer<T>[]) => void;
};

export type DropdownProps<
  T = string,
  M extends boolean = false,
> = M extends true ? DropdownPropsMultiple<T> : DropdownPropsSingle<T>;

type DropdownSignature = {
  <T = string>(userProps: DropdownPropsSingle<T>): JSX.Element;
  <T = string>(userProps: DropdownPropsMultiple<T>): JSX.Element;
};

export const Dropdown: DropdownSignature = <T = string>(
  userProps: DropdownPropsSingle<T> | DropdownPropsMultiple<T>,
) => {
  const [{ unit }] = useConsoleUnitPrototype();
  const [classProps, props] = splitProps(userProps, ['class', 'classList']);

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;
  const [open, setOpen] = createSignal(false);
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [typeaheadQuery, setTypeaheadQuery] = createSignal('');

  let triggerRef: HTMLButtonElement | undefined;
  let typeaheadTimeout: ReturnType<typeof setTimeout> | undefined;
  const optionRefs: Array<HTMLDivElement | undefined> = [];
  const typeaheadResetMs = 350;

  const valueArray = createMemo(() => arrayFrom(props.value));

  const selectedIndices = createMemo(() =>
    valueArray().map((v) =>
      props.options.findIndex((option) => option.value === v),
    ),
  );

  const selectedLabels = () =>
    selectedIndices()
      .map((index) => props.options[index]?.label ?? '')
      .join(', ');

  const canOpen = () => props.options.length > 0 && !props.disabled;

  const minLabelTriggerWidth = createMemo(
    () => Math.min(...props.options.map((o) => o.label.length)) * unit.width,
  );

  const normalizedOptions = createMemo(() =>
    props.options.map((option) => option.label.toLowerCase()),
  );

  const getOptionId = (index: number) => `${instanceId}-option-${index}`;

  const openMenu = (
    initialIndex = props.multiple ? -1 : (selectedIndices().at(0) ?? -1),
  ) => {
    if (!canOpen()) return;
    setActiveIndex(initialIndex);
    setOpen(true);
  };

  const resetTypeahead = () => {
    clearTimeout(typeaheadTimeout);
    setTypeaheadQuery('');
  };

  const moveActiveIndex = (delta: 1 | -1) => {
    const count = props.options.length;
    if (count === 0) return;

    const currentIndex = activeIndex();
    if (currentIndex < 0) {
      setActiveIndex(delta > 0 ? 0 : count - 1);
      return;
    }

    setActiveIndex((currentIndex + delta + count) % count);
  };

  const isPrintableKey = (ev: KeyboardEvent) =>
    ev.key.length === 1 && !ev.altKey && !ev.ctrlKey && !ev.metaKey;

  const updateTypeahead = (key: string) => {
    if (props.options.length === 0) return;

    const query = `${typeaheadQuery()}${key.toLowerCase()}`;
    const labels = normalizedOptions();
    const count = labels.length;
    const from = activeIndex() >= 0 ? activeIndex() : -1;

    for (let offset = 1; offset <= count; offset += 1) {
      const index = (from + offset + count) % count;
      if (labels[index]?.startsWith(query)) {
        setActiveIndex(index);
        setTypeaheadQuery(query);
        clearTimeout(typeaheadTimeout);
        typeaheadTimeout = setTimeout(
          () => setTypeaheadQuery(''),
          typeaheadResetMs,
        );
        return;
      }
    }
  };

  const closeMenu = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) {
      triggerRef?.focus();
    }

    resetTypeahead();
  };

  const selectOption = (value: T) => {
    if (props.multiple) {
      const selectedOptions = valueArray();

      if (selectedOptions.includes(value)) {
        selectedOptions.splice(selectedOptions.indexOf(value), 1);
      } else {
        selectedOptions.push(value);
      }

      props.onChange?.(selectedOptions);
    } else {
      props.onChange?.(value);
      closeMenu();
    }
  };

  const selectAll = () => {
    if (!props.multiple) return;

    const allValues = props.options.map((option) => option.value);

    props.onChange?.(allValues);
  };

  const deselectAll = () => {
    if (!props.multiple) return;
    props.onChange?.([]);
  };

  const handleClickOutside = () => {
    closeMenu(false);
  };

  const handleTriggerKeyDown = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        openMenu();
        break;
      case 'ArrowUp':
        ev.preventDefault();
        openMenu(props.options.length - 1);
        break;
      case 'Enter':
      case ' ': {
        if (!open() && canOpen()) {
          ev.preventDefault();
          openMenu();
        }
        break;
      }
    }
  };

  const toggleMenu = () => {
    if (open()) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleMenuKeyDown = (ev: KeyboardEvent) => {
    const count = props.options.length;

    if (count === 0) {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeMenu();
      }
      return;
    }

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
        setActiveIndex(count - 1);
        break;
      case 'Enter':
      case ' ': {
        ev.preventDefault();
        const option = props.options[activeIndex()];
        if (option) selectOption(option.value);
        break;
      }
      case 'Escape':
        ev.preventDefault();
        closeMenu();
        break;
      case 'Tab':
        closeMenu(false);
        break;
      default: {
        if (!isPrintableKey(ev)) {
          return;
        }

        updateTypeahead(ev.key);
      }
    }
  };

  createEffect(
    on([open, activeIndex], ([isOpen, index]) => {
      if (!isOpen || index < 0) return;

      requestAnimationFrame(() => {
        optionRefs[index]?.scrollIntoView({ block: 'nearest' });
      });
    }),
  );

  onCleanup(resetTypeahead);

  return (
    <div
      classList={{
        [style.dropdown]: true,
        [classProps.class ?? '']: !!classProps.class,
        ...(classProps.classList ?? {}),
      }}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={menuId}
        aria-label={props.ariaLabel}
        disabled={!canOpen()}
        classList={{
          [style.trigger]: true,
          [style.triggerOpen]: open(),
        }}
        onPointerUp={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
      >
        {
          <span
            class={style.label}
            style={{
              'min-width': `${minLabelTriggerWidth()}px`,
            }}
          >
            <TextMarquee>{selectedLabels()}</TextMarquee>
          </span>
        }{' '}
        <span aria-hidden="true">
          <MaterialSymbol
            color="primary"
            symbol={open() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          />
        </span>
      </button>

      <AnchoredPopup
        id={menuId}
        role="listbox"
        aria-labelledby={triggerId}
        aria-activedescendant={
          activeIndex() >= 0 ? getOptionId(activeIndex()) : undefined
        }
        class={style.menu}
        open={open()}
        triggerRef={() => triggerRef}
        onClickOutside={handleClickOutside}
        anchor={props.anchor ?? 'right'}
        matchTriggerWidth
        onKeyDown={handleMenuKeyDown}
      >
        <Show when={props.multiple}>
          <div class={style.selectionControls}>
            <Button severity="secondary" padding={0} onPointerUp={selectAll}>
              <MaterialSymbol symbol="select_all" />
            </Button>

            <Button severity="secondary" padding={0} onPointerUp={deselectAll}>
              <MaterialSymbol symbol="remove_selection" />
            </Button>
          </div>
        </Show>

        <For each={props.options}>
          {(option, index) => (
            <div
              ref={(el) => {
                optionRefs[index()] = el;
              }}
              id={getOptionId(index())}
              role="option"
              tabIndex={-1}
              aria-selected={valueArray().includes(option.value)}
              classList={{
                [style.option]: true,
                [style.optionSelected]: valueArray().includes(option.value),
                [style.optionActive]: index() === activeIndex(),
              }}
              onPointerUp={() => selectOption(option.value)}
              onPointerEnter={() => setActiveIndex(index())}
            >
              {option.label}
            </div>
          )}
        </For>
      </AnchoredPopup>
    </div>
  );
};
