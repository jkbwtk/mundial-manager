import { type JSX, mergeProps, Show } from 'solid-js';
import { Spinner } from '#components/Spinner';
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

export const Button: ParentComponent<ButtonProps> = (userProps) => {
  const props = mergeProps(buttonDefaultProps, userProps);

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
        '--padding': props.padding + 1,
      }}
    >
      <span
        classList={{
          [style.content]: true,
          [style.loading]: props.loading,
        }}
      >
        {props.children}
      </span>

      <Show when={props.loading}>
        <Spinner />
      </Show>
    </button>
  );
};
