import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { matchEventsTable } from '#backend/db/schema';

export const MatchEventInsertSchema = createInsertSchema(matchEventsTable).omit(
  {
    uuid: true,
    $createdAt: true,
    $updatedAt: true,
    $deletedAt: true,
    $updateCounter: true,
  },
);
export type MatchEventInsertSchema = z.infer<typeof MatchEventInsertSchema>;

export const MatchEventSelectSchema = createSelectSchema(matchEventsTable);
export type MatchEventSelectSchema = z.infer<typeof MatchEventSelectSchema>;
