import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { pushSubscriptionsTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';
import { Role } from '#shared/permissions';
import { PushNotificationType } from '#shared/types/api/pushNotification';

export const PushSubscriptionInsertSchema = createInsertSchema(
  pushSubscriptionsTable,
  {
    labels: Labels,
    role: Role,
    notificationTypes: PushNotificationType.array(),
  },
).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type PushSubscriptionInsertSchema = z.infer<
  typeof PushSubscriptionInsertSchema
>;

export const PushSubscriptionSelectSchema = createSelectSchema(
  pushSubscriptionsTable,
  {
    labels: Labels,
    role: Role,
    notificationTypes: PushNotificationType.array(),
  },
);
export type PushSubscriptionSelectSchema = z.infer<
  typeof PushSubscriptionSelectSchema
>;
