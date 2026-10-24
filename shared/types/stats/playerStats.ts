import z from 'zod';

export const PlayerStats = z.object({
  matches: z.number().int().nonnegative(),
  spectatedMatches: z.number().int().nonnegative(),

  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  cancelledMatches: z.number().int().nonnegative(),
  surrenders: z.number().int().nonnegative(),

  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),

  goals: z.number().int().nonnegative(),
  ownGoals: z.number().int().nonnegative(),
  goalTypesCount: z.record(z.uuid(), z.number().int().nonnegative()),
  stylePoints: z.number(),
  mostStylePointsInMatch: z.number().nullable(),

  playtime: z.number().nonnegative(), // milliseconds
  participationTime: z.number().nonnegative(), // milliseconds

  currentWinStreak: z.number().int().nonnegative(),
  longestWinStreak: z.number().int().nonnegative(),
  currentLossStreak: z.number().int().nonnegative(),
  longestLossStreak: z.number().int().nonnegative(),

  mostMatchesInDay: z.number().int().nonnegative(),

  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
  _lastDay: z.string().nullable(),
  _dayMatches: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof PlayerStats>;
