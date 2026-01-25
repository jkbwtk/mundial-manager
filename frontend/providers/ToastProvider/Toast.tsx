import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { customWidgetType } from '#components/Widget';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { ToastSeverity } from '#frontend/types';
import {
  TOAST_ANIMATION_DURATION,
  type ToastInternalEntry,
} from '#providers/ToastProvider';
import style from './ToastProvider.module.scss';

const ListItemWidget = customWidgetType('li');

const SEVERITY_SYMBOLS: Record<ToastSeverity, SupportedMaterialSymbol> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

export interface ToastProps {
  index: number;
  toast: ToastInternalEntry;
  onRemove: () => void;
}

export const Toast: Component<ToastProps> = (props) => {
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;
  const [countingDown, setCountingDown] = createSignal(false);

  const createTimeout = () => {
    removeTimeout();

    if (props.toast.duration !== null) {
      setCountingDown(true);
      timeoutRef = setTimeout(() => {
        props.toast.dismiss();
      }, props.toast.duration);
    }
  };

  const removeTimeout = () => {
    if (timeoutRef !== null) {
      clearTimeout(timeoutRef);

      setCountingDown(false);
      timeoutRef = null;
    }
  };

  const handleInteraction = () => {
    removeTimeout();
  };

  const handleInteractionEnd = () => {
    if (props.index === 0) {
      createTimeout();
    }
  };

  createEffect(() => {
    if (props.toast.isLeaving) {
      removeTimeout();

      setTimeout(() => {
        props.onRemove();
      }, TOAST_ANIMATION_DURATION);
    }
  });

  createEffect(() => {
    const index = props.index;

    if (index === 0) {
      createTimeout();
    } else {
      removeTimeout();
    }
  });

  onCleanup(() => {
    removeTimeout();
  });

  return (
    <ListItemWidget
      classList={{
        [style.toast]: true,
        [style[props.toast.severity ?? 'info']]: true,
        [style.leaving]: props.toast.isLeaving,
        [style.countdown]: countingDown(),
      }}
      style={{
        '--toast-animation-duration': `${TOAST_ANIMATION_DURATION}ms`,
        '--toast-time-duration':
          props.toast.duration !== null ? `${props.toast.duration}ms` : 'unset',
      }}
      onPointerEnter={handleInteraction}
      onPointerLeave={handleInteractionEnd}
    >
      <div class={style.toastContainer}>
        <MaterialSymbol
          class={style.symbol}
          symbol={SEVERITY_SYMBOLS[props.toast.severity ?? 'info']}
        />
        <span class={style.toastContent}>
          <span>{props.toast.message}</span>

          <Show when={props.toast.actions && props.toast.actions.length > 0}>
            {' '}
          </Show>

          <span class={style.toastActions}>
            <For each={props.toast.actions}>
              {(action) => (
                <Button severity={action.severity} onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
            </For>
          </span>
        </span>

        <Show when={props.toast.dismissible}>
          <Button
            class={style.dismiss}
            padding={0}
            onClick={() => props.toast.dismiss()}
          >
            x
          </Button>
        </Show>
      </div>
    </ListItemWidget>
  );
};

export interface QueueIndicatorProps {
  count: number;
}

export const QueueIndicator: Component<QueueIndicatorProps> = (props) => {
  return (
    <ListItemWidget class={style.queueIndicator}>
      +{props.count} more
    </ListItemWidget>
  );
};
