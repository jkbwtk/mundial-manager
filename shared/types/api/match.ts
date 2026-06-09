import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { MatchEvent } from '#shared/types/Sheets';
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
  tableUuid: z.uuid().nullish(),
  ballUuid: z.uuid().nullish(),

  startDate: z.coerce.date(),

  duration: z.number().int().nonnegative(),
  pauseDuration: z.number().int().nonnegative().nullish(),

  status: MatchStatus,

  // playersSide1: z.array(z.uuid()),
  // playersSide2: z.array(z.uuid()),

  spectators: z.array(z.uuid()),

  events: z.array(MatchEvent).default([]),

  hash: z.string(),
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

export const MatchQueryMeta = createQueryMeta({
  sortFields: ['startDate', 'duration', 'pauseDuration', 'status'] as const,
});
export type MatchQueryMeta = z.infer<typeof MatchQueryMeta>;
