import { A, type AnchorProps } from '@solidjs/router';
import { mergeProps } from 'solid-js';
import { buttonDefaultProps, type CustomButtonProps } from '#components/Button';
import style from './Button.module.scss';

export type AnchorButtonProps = AnchorProps & CustomButtonProps;

export const AnchorButton: ParentComponent<AnchorButtonProps> = (userProps) => {
  const props = mergeProps(buttonDefaultProps, userProps);

  return (
    <A
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
    </A>
  );
};
