import type { JSX } from 'solid-js';
import {
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import type { RequiredDefaults } from '#shared/utils';
import style from './TextMarquee.module.scss';

export type TextMarqueeBaseProps = {
  scrollSpeed?: number;
  scrollDelay?: number;
  textGap?: number;
};

export type TextMarqueeProps = TextMarqueeBaseProps &
  JSX.HTMLAttributes<HTMLSpanElement>;

const defaultProps: RequiredDefaults<TextMarqueeBaseProps> = {
  scrollSpeed: 200,
  scrollDelay: 500,
  textGap: 3,
};

const FOCUSABLE_SELECTOR =
  'a[href],button,input,select,textarea,[tabindex],[contenteditable],summary';

export const TextMarquee: Component<TextMarqueeProps> = (userProps) => {
  const [props, htmlProps] = splitProps(mergeProps(defaultProps, userProps), [
    'children',
    'class',
    'classList',
    'scrollSpeed',
    'scrollDelay',
    'textGap',
  ]);

  const [{ unit: consoleUnit }] = useConsoleUnitPrototype();

  let containerRef!: HTMLSpanElement;
  let contentRef!: HTMLSpanElement;
  let cloneRef: HTMLSpanElement | undefined;

  let resizeObserver: ResizeObserver | undefined;
  let mutationObserver: MutationObserver | undefined;

  const [overflowing, setOverflowing] = createSignal(false);

  const sanitizeClone = (root: HTMLElement) => {
    root.querySelectorAll('[id]').forEach((node) => {
      node.removeAttribute('id');
    });

    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach((node) => {
      node.setAttribute('tabindex', '-1');
    });
  };

  const syncClone = () => {
    if (!cloneRef || !contentRef) return;

    const clonedNodes = Array.from(contentRef.childNodes).map((node) =>
      node.cloneNode(true),
    );

    cloneRef.replaceChildren(...clonedNodes);
    sanitizeClone(cloneRef);
  };

  const syncMarquee = () => {
    if (isServer || !containerRef || !contentRef) return;

    const gapPx = Math.max(0, props.textGap) * consoleUnit.width;
    const contentWidth = contentRef.scrollWidth;
    const viewportWidth = containerRef.clientWidth;
    const distancePx = contentWidth + gapPx;

    const hasOverflow = contentWidth > viewportWidth + 0.5;
    setOverflowing(hasOverflow);

    const distanceChars = Math.max(
      1,
      Math.round(distancePx / consoleUnit.width),
    );
    const steppedDistancePx = distanceChars * consoleUnit.width;
    const durationMs = Math.max(
      1,
      Math.round(distanceChars * props.scrollSpeed),
    );

    containerRef.style.setProperty('--marquee-gap-px', `${gapPx}px`);
    containerRef.style.setProperty(
      '--marquee-distance-px',
      `${steppedDistancePx}px`,
    );
    containerRef.style.setProperty('--marquee-steps', `${distanceChars}`);
    containerRef.style.setProperty('--marquee-duration', `${durationMs}ms`);

    if (hasOverflow) {
      syncClone();
    }
  };

  createEffect(() => {
    props.scrollSpeed;
    props.textGap;
    props.children;

    syncMarquee();
  });

  createEffect(() => {
    containerRef.style.setProperty('--marquee-delay', `${props.scrollDelay}ms`);
  });

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      syncMarquee();
    });

    resizeObserver.observe(containerRef);
    resizeObserver.observe(contentRef);

    mutationObserver = new MutationObserver(() => {
      syncMarquee();
    });

    mutationObserver.observe(contentRef, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    syncMarquee();
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();
  });

  return (
    <span
      {...htmlProps}
      ref={containerRef}
      classList={{
        [style.container]: true,
        [style.marquee]: overflowing(),
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <span class={style.track}>
        <span ref={contentRef} class={style.segment}>
          {props.children}
        </span>

        <Show when={overflowing()}>
          <span class={style.gap} aria-hidden="true" />
          <span
            ref={(el) => {
              cloneRef = el;
            }}
            classList={{
              [style.segment]: true,
              [style.clone]: true,
            }}
            aria-hidden="true"
            inert
          />
        </Show>
      </span>
    </span>
  );
};
