import { createInsertSchema } from 'drizzle-orm/zod';
import { ballsTable } from '#backend/db/schema';

export const BallInsertSchema = createInsertSchema(ballsTable).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type BallInsertSchema = ReturnType<typeof BallInsertSchema.parse>;

export const BallSelectSchema = createInsertSchema(ballsTable);
export type BallSelectSchema = ReturnType<typeof BallSelectSchema.parse>;
