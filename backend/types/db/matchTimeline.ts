import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import z from 'zod';
import { matchTimelinesTable } from '#backend/db/schema';
import { Labels } from '#shared/labels';
import { MatchEvent } from '#shared/types/api/matchEvent';

export const MatchTimelineInsertSchema = createInsertSchema(
  matchTimelinesTable,
  {
    events: MatchEvent.array(),
    labels: Labels,
  },
).omit({
  uuid: true,
  leagueUuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type MatchTimelineInsertSchema = z.infer<
  typeof MatchTimelineInsertSchema
>;

export const MatchTimelineSelectSchema = createSelectSchema(
  matchTimelinesTable,
  {
    events: MatchEvent.array(),
    labels: Labels,
  },
);
export type MatchTimelineSelectSchema = z.infer<
  typeof MatchTimelineSelectSchema
>;

export const MatchTimelineUpdateSchema =
  MatchTimelineInsertSchema.partial().extend({
    uuid: z.uuid(),
  });
export type MatchTimelineUpdateSchema = z.infer<
  typeof MatchTimelineUpdateSchema
>;
