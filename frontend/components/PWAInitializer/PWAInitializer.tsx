import { useRegisterSW } from 'virtual:pwa-register/solid';
import { mergeProps } from 'solid-js';
import { isMobile } from '#flib/utils';
import { useToastActions } from '#providers/ToastProvider';
import type { RequiredDefaults } from '#shared/utils';

export type PWAInitializerProps = {
  mobileOnly?: boolean;
};

const PWAInitializerDefaults: RequiredDefaults<PWAInitializerProps> = {
  mobileOnly: true,
};

export const PWAInitializer: Component<PWAInitializerProps> = (userProps) => {
  const props = mergeProps(PWAInitializerDefaults, userProps);

  if (props.mobileOnly && !isMobile()) {
    return null;
  }

  const toast = useToastActions();

  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW(
      _swScriptUrl: string,
      registration: ServiceWorkerRegistration | undefined,
    ) {
      if (registration) {
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000,
        );
      }
    },

    onOfflineReady() {
      toast.info('App ready to work offline', {
        duration: 10_000,
      });
    },

    onNeedRefresh() {
      toast.info('New update available', {
        duration: null,
        actions: [
          {
            label: 'Reload',
            severity: 'primary',
            onClick: () => {
              updateServiceWorker(true);
            },
          },
        ],
      });
    },

    onRegisterError(error) {
      console.error(error);
    },
  });

  return null;
};
