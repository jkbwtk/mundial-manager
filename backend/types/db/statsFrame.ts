import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { statsFramesTable } from '#backend/db/schema';

export const StatsFrameInsertSchema = createInsertSchema(statsFramesTable);
export type StatsFrameInsertSchema = z.infer<typeof StatsFrameInsertSchema>;

export const StatsFrameSelectSchema = createSelectSchema(statsFramesTable);
export type StatsFrameSelectSchema = z.infer<typeof StatsFrameSelectSchema>;
