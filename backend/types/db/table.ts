import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { tablesTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';

export const TableInsertSchema = createInsertSchema(tablesTable, {
  labels: Labels,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type TableInsertSchema = z.infer<typeof TableInsertSchema>;

export const TableSelectSchema = createSelectSchema(tablesTable, {
  labels: Labels,
});
export type TableSelectSchema = z.infer<typeof TableSelectSchema>;

export const TablePublicSchema = TableSelectSchema.omit({
  leagueUuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type TablePublicSchema = z.infer<typeof TablePublicSchema>;
