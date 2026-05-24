import z from 'zod';
import { PaginatedResponse } from '#shared/zod';

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
  ballUuid: z.uuid().nullish(),

  startDate: z.date(),

  duration: z.number().int().nonnegative().nullish(),
  pauseDuration: z.number().int().nonnegative().nullish(),

  status: MatchStatus,

  hash: z.string().readonly(),
});
export type Match = z.infer<typeof Match>;

export const MatchPaginated = PaginatedResponse(Match);
export type MatchPaginated = z.infer<typeof MatchPaginated>;

export const MatchNullable = Match.nullable();
export type MatchNullable = z.infer<typeof MatchNullable>;

export const MatchCreate = Match.omit({ uuid: true });
export type MatchCreate = z.infer<typeof MatchCreate>;

export const MatchUpdate = MatchCreate.partial();
export type MatchUpdate = z.infer<typeof MatchUpdate>;
