import z from 'zod';

export const MatchStatusEnum = {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  CANCELED: 'CANCELED',
  HIDDEN: 'HIDDEN',
  UNKNOWN: 'UNKNOWN',
} as const;

export const MatchStatus = z.enum(MatchStatusEnum);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const Match = z.object({
  uuid: z.uuid(),
  tableUuid: z.uuid(),

  startDate: z.date(),

  duration: z.number().int().nonnegative().nullable().default(null),
  pauseDuration: z.number().int().nonnegative().default(0),

  status: MatchStatus,

  hash: z.string(),
});
export type Match = z.infer<typeof Match>;

export const MatchCreate = Match.omit({ uuid: true });
export type MatchCreate = z.infer<typeof MatchCreate>;

export const MatchUpdate = MatchCreate.partial();
export type MatchUpdate = z.infer<typeof MatchUpdate>;
