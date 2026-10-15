import { createEffect, type JSX, mergeProps, on, Show } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';

import style from './ProgressBar.module.scss';

export type ProgressBarProps = {
  value: number;
  valueSetter?: ((value: number) => void) | null;
  max?: number;
  min?: number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

const defaultProps: RequiredDefaults<ProgressBarProps> = {
  valueSetter: null,
  min: 0,
  max: 100,

  class: '',
  classList: {},
};

export const ProgressBar = (userProps: ProgressBarProps) => {
  const props = mergeProps(defaultProps, userProps);

  // biome-ignore lint/style/useConst: uninitialized ref
  let inputRef: HTMLInputElement = null!;

  const percentage = () =>
    ((props.value - props.min) / (props.max - props.min)) * 100;

  // The browser clamps the value to the max it had when the value was set
  createEffect(
    on([() => props.min, () => props.max, () => props.value], () => {
      if (inputRef) inputRef.value = String(props.value);
    }),
  );

  const handleValueChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement && props.valueSetter) {
      const newValue = Number.parseFloat(event.target.value);
      props.valueSetter(newValue);
    }
  };

  return (
    <div
      classList={{
        [style.container]: true,
        [props.class]: true,

        ...props.classList,
      }}
    >
      <div class={style.progressBarBackground} />
      <div class={style.progressBarContainer}>
        <div class={style.progressBar} style={{ width: `${percentage()}%` }} />
      </div>

      <Show when={props.valueSetter !== null}>
        <input
          ref={inputRef}
          type="range"
          min={props.min}
          max={props.max}
          value={props.value}
          onInput={handleValueChange}
          class={style.progressBarInput}
        />
      </Show>
    </div>
  );
};
