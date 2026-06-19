import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import z from 'zod';
import { matchEventsTable } from '#backend/db/schema';

export const MatchEventInsertSchema = createInsertSchema(matchEventsTable).omit(
  {
    uuid: true,
    leagueUuid: true,
    $createdAt: true,
    $updatedAt: true,
    $deletedAt: true,
    $updateCounter: true,
  },
);
export type MatchEventInsertSchema = z.infer<typeof MatchEventInsertSchema>;

export const MatchEventUpdateSchema = MatchEventInsertSchema.partial().extend({
  uuid: z.uuid(),
});
export type MatchEventUpdateSchema = z.infer<typeof MatchEventUpdateSchema>;

export const MatchEventSelectSchema = createSelectSchema(matchEventsTable, {
  payload: z.any(),
});
export type MatchEventSelectSchema = z.infer<typeof MatchEventSelectSchema>;
