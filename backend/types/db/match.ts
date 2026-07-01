import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { matchesTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';

export const MatchInsertSchema = createInsertSchema(matchesTable, {
  labels: Labels,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type MatchInsertSchema = ReturnType<typeof MatchInsertSchema.parse>;

export const MatchSelectSchema = createSelectSchema(matchesTable, {
  labels: Labels,
});
export type MatchSelectSchema = ReturnType<typeof MatchSelectSchema.parse>;
