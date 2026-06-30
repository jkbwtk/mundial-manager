import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { PaginatedResponse, uuidArray } from '#shared/zod';

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
  tableUuid: z.uuid().nullish(),
  ballUuid: z.uuid().nullish(),

  startDate: z.coerce.date(),

  duration: z.number().nonnegative(),
  pauseDuration: z.number().nonnegative().nullish(),

  side1Score: z.number().int().nonnegative().default(0),
  side2Score: z.number().int().nonnegative().default(0),

  status: MatchStatus,

  playersSide1: uuidArray.check(z.minLength(1), z.maxLength(4)),
  playersSide2: uuidArray.check(z.minLength(1), z.maxLength(4)),

  spectators: uuidArray,

  hash: z.string(),

  labels: z.array(z.string()),
});
export type Match = z.infer<typeof Match>;

export const MatchPaginated = PaginatedResponse(Match);
export type MatchPaginated = z.infer<typeof MatchPaginated>;

export const MatchNullable = Match.nullable();
export type MatchNullable = z.infer<typeof MatchNullable>;

export const MatchCreate = Match.omit({ uuid: true, hash: true });
export type MatchCreate = z.infer<typeof MatchCreate>;

export const MatchUpdate = MatchCreate.partial().extend({ uuid: z.uuid() });
export type MatchUpdate = z.infer<typeof MatchUpdate>;

export const MatchStrategy = MatchCreate.extend({
  uuid: z.uuid().optional(),
});
export type MatchStrategy = z.infer<typeof MatchStrategy>;

export const MatchQueryMeta = createQueryMeta({
  sortFields: ['startDate', 'duration', 'pauseDuration', 'status'] as const,
});
export type MatchQueryMeta = z.infer<typeof MatchQueryMeta>;
