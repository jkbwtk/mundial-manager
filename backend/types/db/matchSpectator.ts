import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { matchSpectatorsTable } from '#backend/db/schema';

export const MatchSpectatorInsertSchema = createInsertSchema(
  matchSpectatorsTable,
).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type MatchSpectatorInsertSchema = z.infer<
  typeof MatchSpectatorInsertSchema
>;

export const MatchSpectatorSelectSchema =
  createSelectSchema(matchSpectatorsTable);
export type MatchSpectatorSelectSchema = z.infer<
  typeof MatchSpectatorSelectSchema
>;
