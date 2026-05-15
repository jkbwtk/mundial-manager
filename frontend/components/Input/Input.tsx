import {
  createSignal,
  createUniqueId,
  type JSX,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import type { RequiredDefaults } from '#shared/utils';
import style from './Input.module.scss';

export type CustomInputProps = {
  type?:
    | 'text'
    | 'password'
    | 'search'
    | 'email'
    | 'number'
    | 'range'
    | 'radio'
    | 'file';
  invalid?: boolean;
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
};

const TextOverflowTypes: CustomInputProps['type'][] = [
  'text',
  'search',
  'email',
  'password',
  'number',
];

export type InputProps = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'type'
> &
  CustomInputProps;

export const inputDefaultProps: RequiredDefaults<CustomInputProps> = {
  type: 'text',
  invalid: false,
  useDirectives: [],
};

export const Input: Component<InputProps> = (userProps) => {
  const [labelProps, restProps] = splitProps(userProps, [
    'id',
    'class',
    'classList',
    'children',
    'invalid',
  ]);

  const props = mergeProps(inputDefaultProps, restProps);
  const id = createUniqueId();

  const inputStyle = () => style[props.type as keyof typeof style];

  let inputRef: HTMLInputElement | undefined;

  const [overflowLeft, setOverflowLeft] = createSignal(false);
  const [overflowRight, setOverflowRight] = createSignal(false);

  const checkOverflow = () => {
    requestAnimationFrame(() => {
      if (!inputRef) return;

      setOverflowLeft(inputRef.scrollLeft > 0);
      setOverflowRight(
        Math.ceil(inputRef.scrollLeft + inputRef.clientWidth) <
          inputRef.scrollWidth,
      );
    });
  };

  onMount(() => {
    if (!inputRef) return;

    applyDirectives(inputRef, props.useDirectives);

    if (!TextOverflowTypes.includes(props.type)) return;

    inputRef.addEventListener('scroll', checkOverflow);
    inputRef.addEventListener('input', checkOverflow);
    window.addEventListener('resize', checkOverflow);

    checkOverflow();

    onCleanup(() => {
      inputRef?.removeEventListener('scroll', checkOverflow);
      inputRef?.removeEventListener('input', checkOverflow);
      window.removeEventListener('resize', checkOverflow);
    });
  });

  return (
    <label
      for={labelProps.id ?? id}
      classList={{
        [style.input]: true,
        [inputStyle()]: true,
        [style.invalid]: labelProps.invalid,
        [style.overflowLeft]: overflowLeft(),
        [style.overflowRight]: overflowRight(),
        [labelProps.class ?? '']: true,
        ...(labelProps.classList ?? {}),
      }}
    >
      <input ref={inputRef} {...props} id={labelProps.id ?? id} />

      {labelProps.children}
    </label>
  );
};
