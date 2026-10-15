import z from 'zod';

export const BallStats = z.object({
  matches: z.number().int().nonnegative(),

  goals: z.number().int().nonnegative(),
  ownGoalCount: z.number().int().nonnegative(),
  ballOutCount: z.number().int().nonnegative(),

  changedInCount: z.number().int().nonnegative(),
  changedOutCount: z.number().int().nonnegative(),

  playtime: z.number().nonnegative(), // milliseconds

  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
});
export type BallStats = z.infer<typeof BallStats>;
