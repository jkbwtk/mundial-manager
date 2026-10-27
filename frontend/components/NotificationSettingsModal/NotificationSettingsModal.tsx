import { createAsync, useAction } from '@solidjs/router';
import {
  createResource,
  createSignal,
  getOwner,
  Match,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import { Button } from '#components/Button';
import { Modal } from '#components/Modal';
import { ModalForm } from '#components/ModalForm';
import {
  getBrowserPushSubscription,
  getPushSupport,
  isIOSDevice,
  registerPushServiceWorker,
  subscribeBrowserPush,
} from '#flib/pushNotifications';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionSavePushSubscription,
  queryCurrentPushSubscription,
} from '#flib/trpcCalls';
import { useModal, useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { PushNotificationTypeLabels } from '#shared/pushNotification';
import { PushNotificationTypes } from '#shared/types/api/pushNotification';
import { PushSubscriptionSave } from '#shared/types/api/pushSubscription';
import style from './NotificationSettingsModal.module.scss';

type PushUnavailableReason =
  | Exclude<ReturnType<typeof getPushSupport>, 'AVAILABLE'>
  | 'NOT_CONFIGURED';

const PushUnavailableMessages: Record<PushUnavailableReason, string> = {
  UNSUPPORTED: 'This browser does not support push notifications.',
  INSTALL_REQUIRED:
    'On Safari, notifications only work in the installed app.',
  IOS_OUTDATED:
    'Notifications need iOS 16.4 or newer. Update your device to enable them.',
  DENIED:
    'Notifications are blocked. Allow them for this site in your browser settings.',
  NOT_CONFIGURED: 'Push notifications are not configured on this server.',
};

const IOS_DENIED_MESSAGE =
  'Notifications are blocked.';

export const NotificationSettingsModal: Component = () => {
  const [, actions] = useToast();
  const { closeModal } = useModalActions();

  const [registration, setRegistration] =
    createSignal<ServiceWorkerRegistration | null>(null);

  const current = createAsync(() => queryCurrentPushSubscription());

  const [browserSubscription, { mutate: setBrowserSubscription }] =
    createResource(
      () => {
        const activeRegistration = registration();
        const publicKey = current()?.publicKey;

        if (!activeRegistration || !publicKey) return false;

        return [activeRegistration, publicKey] as const;
      },
      async ([activeRegistration, publicKey]) => {
        try {
          return await getBrowserPushSubscription(
            activeRegistration,
            publicKey,
          );
        } catch (err) {
          console.error('Push subscription lookup error:', err);

          return null;
        }
      },
    );

  const savePushSubscription = useAction(actionSavePushSubscription);

  const unavailableReason = (): PushUnavailableReason | null => {
    const support = getPushSupport();

    if (support !== 'AVAILABLE') return support;

    if (current()?.publicKey === null) return 'NOT_CONFIGURED';

    return null;
  };

  const getUnavailableMessage = (reason: PushUnavailableReason) => {
    if (reason === 'DENIED' && isIOSDevice()) return IOS_DENIED_MESSAGE;

    return PushUnavailableMessages[reason];
  };

  const handleClose = () => closeModal(false);

  const handleEnable = useHandleButtonAction(
    async () => {
      const activeRegistration = registration();
      const publicKey = current()?.publicKey;

      if (!activeRegistration || !publicKey) return;

      const subscription = await subscribeBrowserPush(
        activeRegistration,
        publicKey,
      );

      await savePushSubscription({
        ...subscription,
        notificationTypes:
          current()?.subscription?.notificationTypes ?? PushNotificationTypes,
      });

      setBrowserSubscription(subscription);
      actions.success('Notifications enabled successfully!');
    },
    (err) => {
      console.error('Notification enable error:', err);
      actions.error('Failed to enable notifications');
    },
  );

  onMount(async () => {
    if (getPushSupport() !== 'AVAILABLE') return;

    try {
      setRegistration(await registerPushServiceWorker());
    } catch (err) {
      console.error('Service worker registration error:', err);
      actions.error('Failed to prepare notifications');
    }
  });

  return (
    <Show when={current()}>
      {(current) => (
        <Switch
          fallback={
            <Modal
              class={style.modal}
              topLeftLabels="Notifications"
              bottomLeftLabels={[
                <Button severity="secondary" onClick={handleClose}>
                  Cancel
                </Button>,
              ]}
              bottomRightLabels={[
                <Button
                  onClick={() => handleEnable()}
                  loading={
                    handleEnable.loading() || browserSubscription.loading
                  }
                  disabled={registration() === null}
                >
                  Enable
                </Button>,
              ]}
            >
              <div class={style.message}>
                Get notified when matches are scheduled, start and finish.
              </div>
            </Modal>
          }
        >
          <Match when={unavailableReason()}>
            {(reason) => (
              <Modal
                class={style.modal}
                topLeftLabels="Notifications"
                bottomRightLabels={[
                  <Button severity="secondary" onClick={handleClose}>
                    Close
                  </Button>,
                ]}
              >
                <div class={style.message}>
                  {getUnavailableMessage(reason())}
                </div>
              </Modal>
            )}
          </Match>

          <Match when={browserSubscription()}>
            {(subscription) => (
              <ModalForm
                class={style.modal}
                model={PushSubscriptionSave}
                action={actionSavePushSubscription}
                title="Notifications"
                submitButtonText="Save"
                successMessage="Notification settings saved successfully!"
                errorMessage="Failed to save notification settings. Please try again."
                logLabel="Notification settings error:"
                instance={{
                  uuid: current().subscription?.uuid ?? '',
                  ...subscription(),
                  notificationTypes:
                    current().subscription?.notificationTypes ??
                    PushNotificationTypes,
                }}
                fields={{
                  endpoint: {
                    label: 'Endpoint',
                    type: 'text',
                    hidden: true,
                    implicitDefault: subscription().endpoint,
                  },
                  p256dh: {
                    label: 'Public key',
                    type: 'text',
                    hidden: true,
                    implicitDefault: subscription().p256dh,
                  },
                  auth: {
                    label: 'Auth secret',
                    type: 'text',
                    hidden: true,
                    implicitDefault: subscription().auth,
                  },
                  notificationTypes: {
                    label: 'Notify about',
                    placeholder: 'No notifications...',
                    type: 'dropdown',
                    multiple: true,
                    options: PushNotificationTypes.map((type) => ({
                      label: PushNotificationTypeLabels[type],
                      value: type,
                    })),
                  },
                }}
              />
            )}
          </Match>
        </Switch>
      )}
    </Show>
  );
};

export function useNotificationSettingsModal(): () => void {
  const [, { open }] = useModal();
  const owner = getOwner();

  return () => {
    open({
      props: { component: NotificationSettingsModal },
      owner,
      closeOnBackgroundClick: false,
    });
  };
}
