import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import { ballsTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';

export const BallInsertSchema = createInsertSchema(ballsTable, {
  labels: Labels,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type BallInsertSchema = ReturnType<typeof BallInsertSchema.parse>;

export const BallSelectSchema = createSelectSchema(ballsTable, {
  labels: Labels,
});
export type BallSelectSchema = ReturnType<typeof BallSelectSchema.parse>;
