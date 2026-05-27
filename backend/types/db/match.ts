import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { matchesTable } from '#backend/db/schema';

export const MatchInsertSchema = createInsertSchema(matchesTable).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type MatchInsertSchema = ReturnType<typeof MatchInsertSchema.parse>;

export const MatchSelectSchema = createSelectSchema(matchesTable);
export type MatchSelectSchema = ReturnType<typeof MatchSelectSchema.parse>;
