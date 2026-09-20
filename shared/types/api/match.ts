import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Labels } from '#shared/labels';
import { PaginatedResponse, uuidArray } from '#shared/zod';

export const SyncId = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9_.:@+-]+$/, 'SYNC_ID_INVALID');
export type SyncId = z.infer<typeof SyncId>;

export const MatchStatusEnum = {
  SCHEDULED: 'SCHEDULED',
  ONGOING: 'ONGOING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  CANCELED: 'CANCELED',
} as const;

export const MatchStatus = z.enum(MatchStatusEnum);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const Match = z.object({
  uuid: z.uuid(),
  tableUuid: z.uuid().nullish(),
  ballUuid: z.uuid().nullish(),

  startDate: z.coerce.date().nullable(),

  duration: z.number().nonnegative().nullable(),
  pauseDuration: z.number().nonnegative(),

  side1Score: z.number().int().nonnegative(),
  side2Score: z.number().int().nonnegative(),

  status: MatchStatus,

  hidden: z.boolean(),

  playersSide1: uuidArray.check(z.minLength(1), z.maxLength(4)),
  playersSide2: uuidArray.check(z.minLength(1), z.maxLength(4)),

  spectators: uuidArray,

  syncId: SyncId.nullable(),

  labels: Labels,
});
export type Match = z.infer<typeof Match>;

export const MatchPaginated = PaginatedResponse(Match);
export type MatchPaginated = z.infer<typeof MatchPaginated>;

export const MatchNullable = Match.nullable();
export type MatchNullable = z.infer<typeof MatchNullable>;

export const MatchCreate = Match.omit({ uuid: true }).extend({
  startDate: Match.shape.startDate.default(null),

  duration: Match.shape.duration.default(null),
  pauseDuration: Match.shape.pauseDuration.default(0),

  status: Match.shape.status.default(MatchStatusEnum.SCHEDULED),

  hidden: Match.shape.hidden.default(false),

  syncId: Match.shape.syncId.default(null),
});
export type MatchCreate = z.infer<typeof MatchCreate>;

export const MatchUpdate = Match.omit({ uuid: true, syncId: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type MatchUpdate = z.infer<typeof MatchUpdate>;

export const MatchQueryMeta = createQueryMeta({
  sortFields: ['startDate', 'duration', 'pauseDuration', 'status'] as const,
});
export type MatchQueryMeta = z.infer<typeof MatchQueryMeta>;
