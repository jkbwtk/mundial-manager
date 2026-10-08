import { createEffect, type JSX, on } from 'solid-js';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './MenuSearch.module.scss';

export interface MenuSearchProps {
  value: string;
  open: boolean;
  onSearch: (value: string) => void;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

function isMenuSearchTypingKey(ev: KeyboardEvent): boolean {
  if (ev.key === 'Home' || ev.key === 'End') return true;

  return ev.key.length === 1 && !ev.altKey && !ev.ctrlKey && !ev.metaKey;
}

export const MenuSearch: Component<MenuSearchProps> = (props) => {
  let ref!: HTMLInputElement;

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (isMenuSearchTypingKey(ev)) ev.stopPropagation();
  };

  createEffect(
    on([() => props.open], ([open]) => {
      if (!open) return;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ref.focus();
        });
      });
    }),
  );

  return (
    <Input
      ref={ref}
      classList={{
        [style.menuSearch]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      value={props.value}
      placeholder="Search..."
      autocomplete="off"
      onInput={(ev) => props.onSearch(ev.currentTarget.value)}
      onKeyDown={handleKeyDown}
    >
      <MaterialSymbol symbol="search" />
    </Input>
  );
};
