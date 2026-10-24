import { createSignal, createUniqueId, For, type JSX } from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import style from './ActionMenu.module.scss';

export interface ActionMenuItem {
  label: string;
  symbol: SupportedMaterialSymbol;

  onSelect: () => void;

  disabled?: boolean;
  danger?: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  label: string;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const ActionMenu: Component<ActionMenuProps> = (props) => {
  const id = createUniqueId();

  let triggerRef!: HTMLButtonElement;

  const [open, setOpen] = createSignal(false);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.focus();
  };

  const selectItem = (item: ActionMenuItem) => {
    if (item.disabled) return;

    closeMenu();
    item.onSelect();
  };

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.key !== 'Escape') return;

    ev.preventDefault();
    closeMenu();
  };

  return (
    <span
      classList={{
        [style.actionMenu]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <Button
        ref={triggerRef}
        type="button"
        severity="secondary"
        padding={0}
        title={props.label}
        aria-label={props.label}
        aria-haspopup="menu"
        aria-expanded={open()}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((current) => !current)}
      >
        <MaterialSymbol symbol="more_horiz" />
      </Button>

      <AnchoredPopup
        id={`${id}-menu`}
        role="menu"
        aria-label={props.label}
        class={style.menu}
        open={open()}
        triggerRef={() => triggerRef}
        onClickOutside={() => setOpen(false)}
        anchor="right"
        onKeyDown={handleKeyDown}
      >
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              role="menuitem"
              classList={{
                [style.item]: true,
                [style.danger]: !!item.danger,
              }}
              disabled={item.disabled}
              onClick={() => selectItem(item)}
            >
              <MaterialSymbol symbol={item.symbol} color="inherit" />{' '}
              {item.label}
            </button>
          )}
        </For>
      </AnchoredPopup>
    </span>
  );
};
