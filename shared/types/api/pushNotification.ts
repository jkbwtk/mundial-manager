import z from 'zod';

export const PushNotificationTypeEnum = {
  MATCH_SCHEDULED: 'MATCH_SCHEDULED',
  MATCH_STARTED: 'MATCH_STARTED',
  MATCH_FINISHED: 'MATCH_FINISHED',
} as const;

export const PushNotificationType = z.enum(PushNotificationTypeEnum);
export type PushNotificationType = z.infer<typeof PushNotificationType>;

export const PushNotificationTypes = Object.values(PushNotificationTypeEnum);

export const DECLARATIVE_WEB_PUSH_KEY = 8030;

export const PushNotification = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  tag: z.string().optional(),

  navigate: z.url(),
});
export type PushNotification = z.infer<typeof PushNotification>;

export const PushNotificationPayload = z.object({
  web_push: z.literal(DECLARATIVE_WEB_PUSH_KEY),
  notification: PushNotification,
});
export type PushNotificationPayload = z.infer<typeof PushNotificationPayload>;
