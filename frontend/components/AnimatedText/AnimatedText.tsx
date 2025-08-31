import {
  type JSX,
  children,
  createEffect,
  createMemo,
  mergeProps,
  onCleanup,
} from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';

import { basicSignal } from '#shared/signal';

export type AnimatedTextBaseProps = {
  duration?: number;
};

export type AnimatedTextProps = JSX.HTMLAttributes<HTMLSpanElement> &
  AnimatedTextBaseProps;

const defaultProps: RequiredDefaults<AnimatedTextBaseProps> = {
  duration: 300,
};

export const AnimatedText: Component<AnimatedTextProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  // biome-ignore lint/style/useConst: uninitialized ref
  let ref: HTMLSpanElement = null!;
  let interval: ReturnType<typeof setInterval>;
  let cursor = 0;

  const resolved = children(() => props.children);
  const textContent = createMemo(() => resolved.toArray().join('') ?? '');

  const bufferedValue = basicSignal(textContent());
  const bufferedValue$ = bufferedValue.subscribe((v) => {
    ref.textContent = v;
  });

  createEffect(() => {
    const newValue = textContent();
    const oldValue = bufferedValue();
    const maxLength = Math.max(newValue.length, oldValue.length);

    if (newValue !== oldValue) {
      clearInterval(interval);
      cursor = 0;

      interval = setInterval(() => {
        bufferedValue.set((prev) => {
          const offsetCursor =
            newValue.length >= oldValue.length
              ? cursor
              : oldValue.length - cursor - 1;

          const nextChar = newValue[offsetCursor];
          const p = prev.split('') as (string | undefined)[];

          p[offsetCursor] = nextChar;

          cursor += 1;

          if (cursor >= maxLength) {
            clearInterval(interval);

            return newValue;
          }

          return p.join('');
        });
      }, props.duration / maxLength);
    }
  });

  onCleanup(() => {
    clearInterval(interval);
    bufferedValue$.unsubscribe();
  });

  return (
    <span
      {...props}
      ref={ref}
      classList={{
        [props.class ?? '']: true,

        ...(props.classList ?? {}),
      }}
    >
      {bufferedValue()}
    </span>
  );
};
