import z from 'zod';

export const PlayerStatsBucketEnum = {
  DAY: 'DAY',
  SEASON: 'SEASON',
  ALL: 'ALL',
} as const;

export const PlayerStatsBucket = z.enum(PlayerStatsBucketEnum);
export type PlayerStatsBucket = z.infer<typeof PlayerStatsBucket>;

export const PlayerStatsBuckets = Object.values(PlayerStatsBucketEnum);

export const PlayerStats = z.object({
  matches: z.number().int().nonnegative(),
  spectatedMatches: z.number().int().nonnegative(),

  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
  cancelledMatches: z.number().int().nonnegative(),

  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),

  goals: z.number().int().nonnegative(),
  ownGoals: z.number().int().nonnegative(),
  goalTypesCount: z.record(z.uuid(), z.number().int().nonnegative()),

  playtime: z.number().nonnegative(), // milliseconds
  participationTime: z.number().nonnegative(), // milliseconds

  currentWinStreak: z.number().int().nonnegative(),
  longestWinStreak: z.number().int().nonnegative(),
  currentLossStreak: z.number().int().nonnegative(),
  longestLossStreak: z.number().int().nonnegative(),

  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof PlayerStats>;
