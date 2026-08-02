import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import z from 'zod';
import { statsFramesTable } from '#backend/db/schema';
import { StatsFrame } from '#shared/types/api/statsFrame';

export const StatsFrameInsertSchema = createInsertSchema(statsFramesTable, {
  payload: StatsFrame,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type StatsFrameInsertSchema = ReturnType<
  typeof StatsFrameInsertSchema.parse
>;

export const StatsFrameUpsertSchema = StatsFrameInsertSchema.extend({
  uuid: z.string().optional(),
});
export type StatsFrameUpsertSchema = ReturnType<
  typeof StatsFrameUpsertSchema.parse
>;

export const StatsFrameSelectSchema = createSelectSchema(statsFramesTable, {
  payload: StatsFrame,
});
export type StatsFrameSelectSchema = ReturnType<
  typeof StatsFrameSelectSchema.parse
>;
