import {
  createEffect,
  createSignal,
  For,
  type JSX,
  on,
  onMount,
  Show,
} from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import style from './ButtonGroup.module.scss';

export interface ButtonGroupOption<T = string> {
  label: JSX.Element;
  value: T;

  color?: string;
  disabled?: boolean;
}

export interface ButtonGroupProps<T = string> {
  options: ButtonGroupOption<T>[];

  value?: T;
  onChange?: (value: T) => void;

  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
}

export const ButtonGroup = <T = string>(props: ButtonGroupProps<T>) => {
  let ref!: HTMLDivElement;

  const [value, setValue] = createSignal<T | undefined>(props.value);

  const select = (option: ButtonGroupOption<T>) => {
    if (props.disabled || option.disabled || value() === option.value) return;

    setValue(() => option.value);
    props.onChange?.(option.value);

    ref.oninput?.(new InputEvent('input', { bubbles: true }));
    ref.onblur?.(new FocusEvent('blur'));
  };

  createEffect(
    on(
      () => props.value,
      (newValue) => setValue(() => newValue),
      { defer: true },
    ),
  );

  onMount(() => {
    // @ts-expect-error
    ref.setCustomValidity = () => {};
    // @ts-expect-error
    ref.checkValidity = () => true;

    // @ts-expect-error
    applyDirectives(ref, props.useDirectives ?? []);
  });

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={props.ariaLabel}
      classList={{
        [style.buttonGroup]: true,
        [style.invalid]: !!props.invalid,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      // @ts-expect-error
      prop:type="buttonGroup"
      prop:name={props.name}
      prop:value={value()}
    >
      <For each={props.options}>
        {(option) => (
          <Button
            type="button"
            role="radio"
            aria-checked={value() === option.value}
            severity={value() === option.value ? 'primary' : 'secondary'}
            padding={0}
            disabled={props.disabled || option.disabled}
            onPointerUp={() => select(option)}
            onClick={(ev) => {
              if (ev.detail === 0) select(option);
            }}
          >
            <Show when={option.color}>
              {(color) => (
                <>
                  <ColorBlock color={color()} width={2} />{' '}
                </>
              )}
            </Show>
            {option.label}
          </Button>
        )}
      </For>
    </div>
  );
};
