import z from 'zod';

export const HeadToHeadRecord = z.object({
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  draws: z.number().int().nonnegative(),
});
export type HeadToHeadRecord = z.infer<typeof HeadToHeadRecord>;

export const HeadToHead = HeadToHeadRecord.extend({
  opponentUuid: z.uuid(),

  singles: HeadToHeadRecord,
  doubles: HeadToHeadRecord,
});
export type HeadToHead = z.infer<typeof HeadToHead>;

export const HeadToHeadQuery = z.object({
  playerUuid: z.uuid(),

  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type HeadToHeadQuery = z.infer<typeof HeadToHeadQuery>;
