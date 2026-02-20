import {
  createEffect,
  type JSX,
  mergeProps,
  on,
  onCleanup,
  type ParentComponent,
  Show,
  splitProps,
} from 'solid-js';
import { isServer, Portal } from 'solid-js/web';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import type { RequiredDefaults } from '#shared/utils';
import style from './AnchoredPopup.module.scss';

export type AnchoredPopupAnchor = 'left' | 'middle' | 'right';

type BaseProps = {
  open: boolean;

  autoFocus?: boolean;

  anchor?: AnchoredPopupAnchor;
  matchTriggerWidth?: boolean;

  triggerRef: () => HTMLElement | undefined;
  popupRef?: (el: HTMLDivElement) => void;

  onClickOutside: () => void;
};

export interface AnchoredPopupProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    BaseProps {}

const defaultProps: RequiredDefaults<BaseProps> = {
  autoFocus: true,

  anchor: 'left',
  matchTriggerWidth: false,

  popupRef: () => {},
};

export const AnchoredPopup: ParentComponent<AnchoredPopupProps> = (
  userProps,
) => {
  const [{ unit }] = useConsoleUnitPrototype();
  const [props, htmlProps] = splitProps(mergeProps(defaultProps, userProps), [
    'open',
    'triggerRef',
    'onClickOutside',
    'anchor',
    'matchTriggerWidth',
    'autoFocus',
    'popupRef',
    'class',
    'classList',
    'style',
  ]);

  let popupRef: HTMLDivElement | undefined;

  const updatePopupStyle = () => {
    const trigger = props.triggerRef();
    if (!trigger || !popupRef) return;

    const triggerRect = trigger.getBoundingClientRect();

    const vv = window.visualViewport;
    const viewportHeight = vv
      ? vv.height
      : document.documentElement.clientHeight;
    const viewportWidth = vv ? vv.width : document.documentElement.clientWidth;
    const vpOffsetLeft = vv ? vv.offsetLeft : 0;
    const vpOffsetTop = vv ? vv.offsetTop : 0;

    const triggerLeft = triggerRect.left + vpOffsetLeft;
    const triggerRight = triggerRect.right + vpOffsetLeft;
    const triggerTop = triggerRect.top + vpOffsetTop;
    const triggerBottom = triggerRect.bottom + vpOffsetTop;

    const maxHeightRaw = Number.parseFloat(
      getComputedStyle(popupRef).maxHeight,
    );
    const popupHeight = Math.min(
      popupRef.scrollHeight,
      Number.isFinite(maxHeightRaw) && maxHeightRaw > 0
        ? maxHeightRaw
        : Number.POSITIVE_INFINITY,
    );

    const availableBelow = viewportHeight - triggerRect.bottom - unit.height;
    const availableAbove = triggerRect.top - unit.height;
    const openAbove =
      availableBelow < popupHeight &&
      (availableAbove >= popupHeight || availableAbove > availableBelow);

    const popupWidth = Math.max(
      props.matchTriggerWidth ? triggerRect.width : 0,
      popupRef.getBoundingClientRect().width,
    );

    const anchorX = {
      left: triggerLeft,
      middle: triggerLeft + triggerRect.width / 2 - popupWidth / 2,
      right: triggerRight - popupWidth,
    } satisfies Record<AnchoredPopupAnchor, number>;

    const rawLeft = anchorX[props.anchor];
    const left = Math.min(
      Math.max(vpOffsetLeft + unit.width, rawLeft),
      Math.max(
        vpOffsetLeft + unit.width,
        vpOffsetLeft + viewportWidth - popupWidth - unit.width,
      ),
    );

    const rawTop = openAbove ? triggerTop - popupHeight : triggerBottom;
    const top = Math.min(
      Math.max(vpOffsetTop, rawTop),
      Math.max(vpOffsetTop, vpOffsetTop + viewportHeight - popupHeight),
    );

    Object.assign(popupRef.style, {
      top: `${top}px`,
      left: `${left}px`,
      ...(props.matchTriggerWidth
        ? { 'min-width': `${triggerRect.width}px` }
        : {}),
    });
  };

  const handleClickOutside = (ev: MouseEvent) => {
    const path = ev.composedPath();
    const trigger = props.triggerRef();
    if (
      (!trigger || !path.includes(trigger)) &&
      (!popupRef || !path.includes(popupRef))
    ) {
      props.onClickOutside();
    }
  };

  createEffect(
    on(
      () => props.open,
      (isOpen) => {
        if (isServer || !isOpen) return;

        const observer = new ResizeObserver(updatePopupStyle);

        requestAnimationFrame(() => {
          updatePopupStyle();
          if (props.autoFocus) popupRef?.focus();
          const trigger = props.triggerRef();
          if (trigger) observer.observe(trigger);
          if (popupRef) observer.observe(popupRef);
        });

        document.addEventListener('pointerdown', handleClickOutside);
        window.addEventListener('scroll', updatePopupStyle, true);
        window.addEventListener('resize', updatePopupStyle);
        window.visualViewport?.addEventListener('scroll', updatePopupStyle);
        window.visualViewport?.addEventListener('resize', updatePopupStyle);

        onCleanup(() => {
          observer?.disconnect();
          document.removeEventListener('pointerdown', handleClickOutside);
          window.removeEventListener('scroll', updatePopupStyle, true);
          window.removeEventListener('resize', updatePopupStyle);
          window.visualViewport?.removeEventListener(
            'scroll',
            updatePopupStyle,
          );
          window.visualViewport?.removeEventListener(
            'resize',
            updatePopupStyle,
          );
        });
      },
    ),
  );

  return (
    <Show when={props.open}>
      <Portal>
        <div
          ref={(el) => {
            popupRef = el;
            props.popupRef(el);
          }}
          classList={{
            [style.popup]: true,
            [props.class ?? '']: !!props.class,
            ...(props.classList ?? {}),
          }}
          tabIndex={-1}
          {...htmlProps}
        >
          {htmlProps.children}
        </div>
      </Portal>
    </Show>
  );
};
