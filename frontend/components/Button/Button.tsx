import {
  createEffect,
  createSignal,
  type JSX,
  mergeProps,
  onCleanup,
  Show,
} from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './Button.module.scss';

export type CustomButtonProps = {
  disabled?: boolean;
  severity?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  padding?: number;
};

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  CustomButtonProps;

export const buttonDefaultProps: RequiredDefaults<CustomButtonProps> = {
  disabled: false,
  severity: 'primary',
  loading: false,
  padding: 1,
};

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const SPINNER_INTERVAL = 200; // milliseconds

export const Button: ParentComponent<ButtonProps> = (userProps) => {
  const props = mergeProps(buttonDefaultProps, userProps);

  const [spinnerIndex, setSpinnerIndex] = createSignal(0);

  let interval: ReturnType<typeof setInterval> | undefined;

  createEffect(() => {
    clearInterval(interval);

    if (props.loading) {
      interval = setInterval(() => {
        setSpinnerIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
      }, SPINNER_INTERVAL);
    } else {
      setSpinnerIndex(0);
    }
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  return (
    <button
      {...props}
      disabled={props.disabled || props.loading}
      classList={{
        [props.class ?? '']: !!props.class,
        [style.button]: true,
        [style.primary]:
          props.severity === 'primary' && props.disabled === false,
        [style.secondary]: props.severity === 'secondary',
        [style.danger]: props.severity === 'danger',
        [style.disabled]: props.disabled || props.loading,
        ...(props.classList ?? {}),
      }}
      style={{
        '--padding': props.padding,
      }}
    >
      <span
        classList={{
          [style.loading]: props.loading,
        }}
      >
        {props.children}
      </span>

      <Show when={props.loading}>
        <span class={style.spinner}>{SPINNER_FRAMES[spinnerIndex()]}</span>
      </Show>
    </button>
  );
};
