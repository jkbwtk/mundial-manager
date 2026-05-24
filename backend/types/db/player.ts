import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { playersTable } from '#backend/db/schema';

export const PlayerInsertSchema = createInsertSchema(playersTable).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type PlayerInsertSchema = ReturnType<typeof PlayerInsertSchema.parse>;

export const PlayerSelectSchema = createSelectSchema(playersTable);
export type PlayerSelectSchema = ReturnType<typeof PlayerSelectSchema.parse>;
