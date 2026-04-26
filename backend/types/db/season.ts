import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { seasonsTable } from '#backend/db/schema';
import { SeasonConfig } from '#shared/types/api/season';

export const SeasonInsertSchema = createInsertSchema(seasonsTable, {
  config: SeasonConfig,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type SeasonInsertSchema = z.infer<typeof SeasonInsertSchema>;

export const SeasonSelectSchema = createSelectSchema(seasonsTable);
export type SeasonSelectSchema = z.infer<typeof SeasonSelectSchema>;

export const SeasonPublicSchema = SeasonSelectSchema.omit({
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type SeasonPublicSchema = z.infer<typeof SeasonPublicSchema>;
