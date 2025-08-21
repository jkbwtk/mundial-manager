import { debounce } from '@solid-primitives/scheduled';
import type { JSX } from 'solid-js';
import {
  children,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import type { RequiredDefaults } from '#lib/utils';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import style from './TextMarquee.module.scss';

export type TextMarqueeBaseProps = {
  scrollSpeed?: string;
  scrollDelay?: number;
  textGap?: number;
};

export type TextMarquee = TextMarqueeBaseProps &
  JSX.HTMLAttributes<HTMLSpanElement>;

const defaultProps: RequiredDefaults<TextMarqueeBaseProps> = {
  scrollSpeed: '0.2s',
  scrollDelay: 500,
  textGap: 3,
};

export const TextMarquee: Component<TextMarquee> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);
  const [{ unit: consoleUnit }] = useConsoleUnitPrototype();

  const resolved = children(() => props.children);
  const textContent = createMemo(() => resolved.toArray().join('') ?? '');

  // biome-ignore lint/style/useConst: uninitialized ref
  let ref: HTMLSpanElement = null!;

  const [visibleWidth, setVisibleWidth] = createSignal(0);
  const [scrolling, setScrolling] = createSignal(false);
  const scrollingDebounce = debounce(
    (v: boolean) => setScrolling(v),
    props.scrollDelay,
  );

  const shouldScroll = () => {
    if (isServer || ref === null) {
      return false;
    }

    ref.style.setProperty(
      '--total-width-chars',
      textContent().length.toString(),
    );
    ref.style.setProperty('--text-content', `"${textContent()}"`);

    const overflowing = visibleWidth() < textContent().length;
    scrollingDebounce(overflowing);

    return overflowing;
  };

  if (!isServer) {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries.pop();
      if (entry === undefined) {
        return;
      }

      const chars = Math.round(entry.contentRect.width / consoleUnit.width);
      setVisibleWidth(chars);
    });

    onMount(() => {
      resizeObserver.observe(ref);
    });

    onCleanup(() => {
      resizeObserver.unobserve(ref);
    });

    createEffect(() => {
      ref.style.setProperty('--text-gap', `${props.textGap}`);
      ref.style.setProperty('--scroll-speed', props.scrollSpeed);
    });
  }

  return (
    <span
      {...props}
      ref={ref}
      aria-label={textContent()}
      classList={{
        [style.container]: true,
        [style.marquee]: shouldScroll(),
        [style.scrolling]: scrolling(),
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
    />
  );
};
