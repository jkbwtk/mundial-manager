import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { tablesTable } from '#backend/db/schema';

export const TableInsertSchema = createInsertSchema(tablesTable).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type TableInsertSchema = z.infer<typeof TableInsertSchema>;

export const TableSelectSchema = createSelectSchema(tablesTable);
export type TableSelectSchema = z.infer<typeof TableSelectSchema>;

export const TablePublicSchema = TableSelectSchema.omit({
  leagueUuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type TablePublicSchema = z.infer<typeof TablePublicSchema>;
