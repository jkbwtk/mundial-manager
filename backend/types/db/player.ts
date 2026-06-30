import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { playersTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';

export const PlayerInsertSchema = createInsertSchema(playersTable, {
  labels: Labels,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type PlayerInsertSchema = ReturnType<typeof PlayerInsertSchema.parse>;

export const PlayerSelectSchema = createSelectSchema(playersTable, {
  labels: Labels,
});
export type PlayerSelectSchema = ReturnType<typeof PlayerSelectSchema.parse>;
