import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { leaguesTable } from '#backend/db/schema';
import { League } from '#shared/types/api/league';

export const LeagueInsertSchema = createInsertSchema(leaguesTable, {
  seasonConfig: League.shape.seasonConfig,
}).omit({
  uuid: true,
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type LeagueInsertSchema = z.infer<typeof LeagueInsertSchema>;

export const LeagueSelectSchema = createSelectSchema(leaguesTable, {
  seasonConfig: League.shape.seasonConfig,
});
export type LeagueSelectSchema = z.infer<typeof LeagueSelectSchema>;

export const LeaguePublicSchema = LeagueSelectSchema.omit({
  $createdAt: true,
  $updatedAt: true,
  $deletedAt: true,
  $updateCounter: true,
});
export type LeaguePublicSchema = z.infer<typeof LeaguePublicSchema>;
