import z from 'zod';

export const LuckComeback = z.object({
  matchUuid: z.uuid(),
  startDate: z.coerce.date().nullable(),

  probability: z.number(),
  score: z.string(),
});
export type LuckComeback = z.infer<typeof LuckComeback>;

export const LuckStats = z.object({
  matches: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),

  expectedWins: z.number(), // from pre match odds
  goalWins: z.number(), // expected from the goals scored and conceded
  luck: z.number(), // wins

  bestComeback: LuckComeback.nullable(),
});
export type LuckStats = z.infer<typeof LuckStats>;
