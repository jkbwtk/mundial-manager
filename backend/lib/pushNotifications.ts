import webPush from 'web-push';
import type { DB } from '#backend/db/database';
import { PushSubscriptionModel } from '#backend/db/models/PushSubscriptionModel';
import { environment } from '#backend/environment';
import type { PushSubscriptionSelectSchema } from '#backend/types/db/pushSubscription';
import { logger } from '#shared/logger';
import {
  hasPermissions,
  type Permission,
  PermissionEnum,
  RolePermissions,
} from '#shared/permissions';
import { DAY_MS, msToSeconds } from '#shared/timeUtils';
import {
  DECLARATIVE_WEB_PUSH_KEY,
  type PushNotification,
  type PushNotificationPayload,
  type PushNotificationType,
} from '#shared/types/api/pushNotification';

const PushNotificationPermissions: Record<PushNotificationType, Permission[]> =
  {
    MATCH_SCHEDULED: [PermissionEnum.MATCHES_READ],
    MATCH_STARTED: [PermissionEnum.MATCHES_READ],
    MATCH_FINISHED: [PermissionEnum.MATCHES_READ],
  };

export const PushNotificationTTLs: Record<PushNotificationType, number> = {
  MATCH_SCHEDULED: DAY_MS,
  MATCH_STARTED: 15 * 60 * 1000,
  MATCH_FINISHED: 60 * 60 * 1000,
};

const PushNotificationUrgencies: Record<PushNotificationType, webPush.Urgency> =
  {
    MATCH_SCHEDULED: 'normal',
    MATCH_STARTED: 'normal',
    MATCH_FINISHED: 'high',
  };

const ExpiredSubscriptionStatusCodes = [404, 410];

const PUSH_REQUEST_TIMEOUT_MS = 10_000;

type VapidDetails = NonNullable<webPush.RequestOptions['vapidDetails']>;

function getVapidDetails(): VapidDetails | null {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = environment;

  if (
    VAPID_PUBLIC_KEY === null ||
    VAPID_PRIVATE_KEY === null ||
    VAPID_SUBJECT === null
  ) {
    return null;
  }

  return {
    subject: VAPID_SUBJECT,
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY,
  };
}

async function sendPushNotification(
  db: DB,
  subscription: PushSubscriptionSelectSchema,
  payload: string,
  options: webPush.RequestOptions,
): Promise<void> {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      payload,
      options,
    );
  } catch (err) {
    if (
      !(err instanceof webPush.WebPushError) ||
      !ExpiredSubscriptionStatusCodes.includes(err.statusCode)
    ) {
      throw err;
    }

    await PushSubscriptionModel.delete(
      db,
      subscription.leagueUuid,
      subscription.uuid,
    );

    logger.debug('Removed expired push subscription %s', subscription.uuid, {
      label: ['pushNotifications', 'sendPushNotification'],
    });
  }
}

export async function sendLeaguePushNotification(
  db: DB,
  leagueUuid: string,
  type: PushNotificationType,
  createNotification: () => Promise<PushNotification>,
  topic: string,
): Promise<void> {
  const vapidDetails = getVapidDetails();

  if (vapidDetails === null) return;

  const subscriptions = (
    await PushSubscriptionModel.getAllByNotificationType(db, leagueUuid, type)
  ).filter((subscription) =>
    hasPermissions(
      RolePermissions[subscription.role],
      PushNotificationPermissions[type],
    ),
  );

  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    web_push: DECLARATIVE_WEB_PUSH_KEY,
    notification: await createNotification(),
  } satisfies PushNotificationPayload);
  const options: webPush.RequestOptions = {
    vapidDetails,
    TTL: msToSeconds(PushNotificationTTLs[type]),
    urgency: PushNotificationUrgencies[type],
    topic,
    timeout: PUSH_REQUEST_TIMEOUT_MS,
  };

  const results = await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(db, subscription, payload, options),
    ),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') continue;

    logger.warn('Failed to send %s push notification', type, {
      label: ['pushNotifications', 'sendLeaguePushNotification'],
      error: result.reason,
    });
  }
}
