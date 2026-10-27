import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  PushSubscription,
  PushSubscriptionCurrent,
  type PushSubscriptionSave,
} from '#shared/types/api/pushSubscription';

export const queryCurrentPushSubscription = query(async () => {
  const currentSubscription =
    await trpcClient.pushSubscriptions.getCurrent.query();

  return PushSubscriptionCurrent.parse(currentSubscription);
}, 'queryCurrentPushSubscription');

export const actionSavePushSubscription = action(
  async (subscription: PushSubscriptionSave) => {
    const savedSubscription =
      await trpcClient.pushSubscriptions.save$.mutate(subscription);

    return json(PushSubscription.parse(savedSubscription), {
      revalidate: ['queryCurrentPushSubscription'],
    });
  },
  'actionSavePushSubscription',
);
