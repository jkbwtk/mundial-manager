import { type JSX, mergeProps } from 'solid-js';
import type { RequiredDefaults } from '#lib/utils';
import style from './Button.module.scss';

type CustomButtonProps = {
  disabled?: boolean;
  severity?: 'primary' | 'secondary' | 'danger';
};

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  CustomButtonProps;

const defaultProps: RequiredDefaults<CustomButtonProps> = {
  disabled: false,
  severity: 'primary',
};

export const Button: ParentComponent<ButtonProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  return (
    <button
      {...props}
      classList={{
        [props.class ?? '']: !!props.class,
        [style.button]: true,
        [style.primary]:
          props.severity === 'primary' && props.disabled === false,
        [style.secondary]: props.severity === 'secondary',
        [style.danger]: props.severity === 'danger',
        [style.disabled]: props.disabled,
        ...(props.classList ?? {}),
      }}
    >
      {props.children}
    </button>
  );
};
