import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Labels } from '#shared/labels';
import { Role } from '#shared/permissions';
import {
  PushNotificationType,
  PushNotificationTypes,
} from '#shared/types/api/pushNotification';

export const PushSubscription = z.object({
  uuid: z.uuid(),

  clientUuid: z.uuid(),
  role: Role,

  endpoint: z.url().max(2048),
  p256dh: z.string().min(1).max(255),
  auth: z.string().min(1).max(255),

  notificationTypes: PushNotificationType.array().max(
    PushNotificationTypes.length,
  ),
  expiresAt: z.coerce.date(),

  labels: Labels,
});
export type PushSubscription = z.infer<typeof PushSubscription>;

export const PushSubscriptionNullable = PushSubscription.nullable();
export type PushSubscriptionNullable = z.infer<typeof PushSubscriptionNullable>;

export const PushSubscriptionCreate = PushSubscription.omit({ uuid: true });
export type PushSubscriptionCreate = z.infer<typeof PushSubscriptionCreate>;

export const PushSubscriptionUpdate = PushSubscription.omit({
  uuid: true,
  clientUuid: true,
})
  .partial()
  .extend({ uuid: z.uuid() });
export type PushSubscriptionUpdate = z.infer<typeof PushSubscriptionUpdate>;

export const PushSubscriptionQueryMeta = createQueryMeta({
  sortFields: ['expiresAt'] as const,
});
export type PushSubscriptionQueryMeta = z.infer<
  typeof PushSubscriptionQueryMeta
>;

export const PushSubscriptionSave = PushSubscription.pick({
  endpoint: true,
  p256dh: true,
  auth: true,
  notificationTypes: true,
});
export type PushSubscriptionSave = z.infer<typeof PushSubscriptionSave>;

export const PushSubscriptionCurrent = z.object({
  publicKey: z.string().nullable(),
  subscription: PushSubscriptionNullable,
});
export type PushSubscriptionCurrent = z.infer<typeof PushSubscriptionCurrent>;
