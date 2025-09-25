import { type JSX, mergeProps } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './Input.module.scss';

// biome-ignore lint/complexity/noBannedTypes: yeah
export type CustomInputProps = {};

export type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> &
  CustomInputProps;

export const inputDefaultProps: RequiredDefaults<CustomInputProps> = {};

export const Input: Component<InputProps> = (userProps) => {
  const props = mergeProps(inputDefaultProps, userProps);

  return (
    <div
      classList={{
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <input {...props} class={style.input} classList={undefined} />
    </div>
  );
};
