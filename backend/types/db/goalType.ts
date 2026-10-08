import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { goalTypesTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';

export const GoalTypeInsertSchema = createInsertSchema(goalTypesTable, {
  labels: Labels,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type GoalTypeInsertSchema = z.infer<typeof GoalTypeInsertSchema>;

export const GoalTypeSelectSchema = createSelectSchema(goalTypesTable, {
  labels: Labels,
});
export type GoalTypeSelectSchema = z.infer<typeof GoalTypeSelectSchema>;
