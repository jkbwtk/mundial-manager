import { type JSX, mergeProps } from 'solid-js';
import { buttonDefaultProps, type CustomButtonProps } from '#components/Button';
import style from './Button.module.scss';

export type VanillaAnchorButtonProps =
  JSX.AnchorHTMLAttributes<HTMLAnchorElement> & CustomButtonProps;

export const VanillaAnchorButton: ParentComponent<VanillaAnchorButtonProps> = (
  userProps,
) => {
  const props = mergeProps(buttonDefaultProps, userProps);

  return (
    <a
      {...props}
      classList={{
        [props.class ?? '']: !!props.class,
        [style.button]: true,
        [style.primary]:
          props.severity === 'primary' && props.disabled === false,
        [style.secondary]: props.severity === 'secondary',
        [style.danger]: props.severity === 'danger',
        [style.disabled]: props.disabled,
        'no-style': true,
        ...(props.classList ?? {}),
      }}
      style={{
        '--padding': props.padding + 1,
      }}
    >
      <span
        classList={{
          [style.content]: true,
        }}
      >
        {props.children}
      </span>
    </a>
  );
};
