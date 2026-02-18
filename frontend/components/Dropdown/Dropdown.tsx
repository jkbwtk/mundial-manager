import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import style from './Dropdown.module.scss';

export interface DropdownOption<T extends string = string> {
  label: string;
  value: T;
}

export type DropdownAnchor = 'left' | 'middle' | 'right';

export interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
  anchor?: DropdownAnchor;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

type DropdownSignature = <T extends string = string>(
  userProps: DropdownProps<T>,
) => JSX.Element;

const dropdownDefaultProps = {
  disabled: false,
  anchor: 'right' as DropdownAnchor,
};

export const Dropdown: DropdownSignature = <T extends string = string>(
  userProps: DropdownProps<T>,
) => {
  const [{ unit }] = useConsoleUnitPrototype();
  const [classProps, restProps] = splitProps(userProps, ['class', 'classList']);

  const props = mergeProps(dropdownDefaultProps, restProps);

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

  const selectedIndex = createMemo(() =>
    props.options.findIndex((option) => option.value === props.value),
  );

  const selectedLabel = () =>
    props.options[selectedIndex()]?.label ?? props.value;

  const canOpen = () => props.options.length > 0 && !props.disabled;

  const minLabelTriggerWidth = createMemo(
    () => Math.min(...props.options.map((o) => o.label.length)) * unit.width,
  );

  const normalizedOptions = createMemo(() =>
    props.options.map((option) => option.label.toLowerCase()),
  );

  const getOptionId = (index: number) => `${instanceId}-option-${index}`;

  const openMenu = (initialIndex = selectedIndex()) => {
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
    const from = activeIndex() >= 0 ? activeIndex() : selectedIndex();

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
    props.onChange?.(value);
    closeMenu();
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
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
      >
        {
          <span
            style={{
              'min-width': `${minLabelTriggerWidth()}px`,
            }}
          >
            {selectedLabel()}
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
        anchor={props.anchor}
        matchTriggerWidth
        onKeyDown={handleMenuKeyDown}
      >
        <For each={props.options}>
          {(option, index) => (
            <div
              ref={(el) => {
                optionRefs[index()] = el;
              }}
              id={getOptionId(index())}
              role="option"
              tabIndex={-1}
              aria-selected={option.value === props.value}
              classList={{
                [style.option]: true,
                [style.optionSelected]: option.value === props.value,
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
