import { Show } from 'solid-js';
import { isOnline } from '#flib/network';
import { hasStaleData, retryStaleData } from '#flib/resilientAsync';
import { Toast } from '#providers/ToastProvider';
import style from './ConnectionStatus.module.scss';

export const ConnectionStatus: Component = () => {
  const message = () =>
    isOnline()
      ? 'Some data could not be refreshed'
      : 'Connection lost, showing the last loaded data';

  return (
    <Show when={!isOnline() || hasStaleData()}>
      <div class={style.container}>
        <Toast
          index={0}
          toast={{
            id: '',
            dismiss: () => null,
            message: message(),
            isLeaving: false,
            createdAt: Date.now(),
            dismissible: false,
            duration: 0,
            severity: 'warning',
            actions: hasStaleData()
              ? [
                  {
                    label: 'Retry',
                    severity: 'secondary',
                    onClick: retryStaleData,
                  },
                ]
              : [],
          }}
          onRemove={() => null}
          animateVertical={true}
        />
      </div>
    </Show>
  );
};
