import { createUniqueId, type JSX, mergeProps, splitProps } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './Input.module.scss';

// biome-ignore lint/complexity/noBannedTypes: yeah
export type CustomInputProps = {};

export type InputProps = JSX.InputHTMLAttributes<HTMLInputElement> &
  CustomInputProps;

export const inputDefaultProps: RequiredDefaults<CustomInputProps> = {};

export const Input: Component<InputProps> = (userProps) => {
  const [labelProps, restProps] = splitProps(userProps, [
    'id',
    'class',
    'classList',
    'children',
  ]);

  const props = mergeProps(inputDefaultProps, restProps);
  const id = createUniqueId();

  return (
    <label
      for={labelProps.id ?? id}
      classList={{
        [style.input]: true,
        [labelProps.class ?? '']: true,
        ...(labelProps.classList ?? {}),
      }}
    >
      <input {...props} id={labelProps.id ?? id} />

      {labelProps.children}
    </label>
  );
};
