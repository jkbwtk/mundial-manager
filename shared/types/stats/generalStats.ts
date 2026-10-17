import z from 'zod';
import { MatchEventType } from '#shared/types/api/matchEvent';

export const AggregateStats = z.object({
  matches: z.number().int().nonnegative(),
  cancelledMatches: z.number().int().nonnegative(),

  players: z.uuid().array(),

  goals: z.number().int().nonnegative(),
  ownGoalCount: z.number().int().nonnegative(),
  goalTypesCount: z.record(z.uuid(), z.number().int().nonnegative()),

  eventTypesCount: z.partialRecord(
    MatchEventType,
    z.number().int().nonnegative(),
  ),

  playtime: z.number().nonnegative(), // milliseconds
  participationTime: z.number().nonnegative(), // milliseconds
  pauseDuration: z.number().nonnegative(), // milliseconds
  individualPlaytime: z.number().nonnegative(), // milliseconds

  longestTimeBetweenGoals: z.number().nonnegative().nullable(), // milliseconds
  shortestTimeBetweenGoals: z.number().nonnegative().nullable(), // milliseconds

  leadChanges: z.number().int().nonnegative(),
  biggestLead: z.number().int().nonnegative(),

  _totalTimeBetweenGoals: z.number().nonnegative(), // milliseconds
  _timeBetweenGoalsCount: z.number().int().nonnegative(),
  _goalsWithDuration: z.number().int().nonnegative(),
  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
  _playersWithoutDuration: z.number().int().nonnegative(),
});
export type AggregateStats = z.infer<typeof AggregateStats>;
