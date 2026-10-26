import type { PushNotificationType } from '#shared/types/api/pushNotification';

export const PushNotificationTypeLabels: Record<PushNotificationType, string> =
  {
    MATCH_SCHEDULED: 'Match scheduled',
    MATCH_STARTED: 'Match started',
    MATCH_FINISHED: 'Match finished',
  };
