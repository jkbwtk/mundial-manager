import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { matchCreateDefaults } from '#shared/defaults/match';
import { Labels } from '#shared/labels';
import { PaginatedResponse, uuidArray, withDefaults } from '#shared/zod';

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
  SURRENDERED: 'SURRENDERED',
  CANCELED: 'CANCELED',
} as const;

export const MatchStatus = z.enum(MatchStatusEnum);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const MatchStatuses = Object.values(MatchStatusEnum);

export const LiveMatchStatuses: MatchStatus[] = [
  MatchStatusEnum.ONGOING,
  MatchStatusEnum.PAUSED,
];

export const DecidedMatchStatuses: MatchStatus[] = [
  MatchStatusEnum.FINISHED,
  MatchStatusEnum.SURRENDERED,
];

export const EndedMatchStatuses: MatchStatus[] = [
  ...DecidedMatchStatuses,
  MatchStatusEnum.CANCELED,
];

export const MatchStateErrorTypeEnum = {
  STATUS_DOES_NOT_MATCH_TIMELINE: 'STATUS_DOES_NOT_MATCH_TIMELINE',
  SURRENDER_EVENT_MISSING: 'SURRENDER_EVENT_MISSING',
  CANCEL_EVENT_MISSING: 'CANCEL_EVENT_MISSING',
  PAUSE_EVENT_MISSING: 'PAUSE_EVENT_MISSING',
  SCHEDULED_WITH_DURATION: 'SCHEDULED_WITH_DURATION',
  SCHEDULED_WITH_SCORE: 'SCHEDULED_WITH_SCORE',
  SCHEDULED_WITH_PAUSE: 'SCHEDULED_WITH_PAUSE',
  LIVE_WITHOUT_START_DATE: 'LIVE_WITHOUT_START_DATE',
  SCORE_DOES_NOT_MATCH_TIMELINE: 'SCORE_DOES_NOT_MATCH_TIMELINE',
  PAUSE_DOES_NOT_MATCH_TIMELINE: 'PAUSE_DOES_NOT_MATCH_TIMELINE',
} as const;

export const MatchStateErrorType = z.enum(MatchStateErrorTypeEnum);
export type MatchStateErrorType = z.infer<typeof MatchStateErrorType>;

export const Match = z.object({
  uuid: z.uuid(),
  tableUuid: z.uuid().nullish(),
  ballUuid: z.uuid().nullish(),

  startDate: z.coerce.date().nullable(),

  duration: z.number().nonnegative().nullable(), // milliseconds
  pauseDuration: z.number().nonnegative(), // milliseconds

  side1Score: z.number().int().nonnegative(),
  side2Score: z.number().int().nonnegative(),

  status: MatchStatus,

  hidden: z.boolean(),

  stakesModifier: z.number().int().min(1),

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

export const MatchCreate = withDefaults(
  Match.omit({ uuid: true }),
  matchCreateDefaults,
);
export type MatchCreate = z.infer<typeof MatchCreate>;

export const MatchUpdate = Match.omit({ uuid: true, syncId: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type MatchUpdate = z.infer<typeof MatchUpdate>;

export const MatchesBySyncIds = z.object({
  syncIds: SyncId.array().max(500),
});
export type MatchesBySyncIds = z.infer<typeof MatchesBySyncIds>;

export const MatchFilters = z.object({
  status: z
    .preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      MatchStatus.array().max(MatchStatuses.length),
    )
    .optional(),
  tableUuid: z.uuid().optional(),
  playerUuid: z.uuid().optional(),
  from: z.coerce.number().int().optional(), // milliseconds since epoch, inclusive
  to: z.coerce.number().int().optional(), // milliseconds since epoch, exclusive
});
export type MatchFilters = z.infer<typeof MatchFilters>;

export const MatchQueryMeta = createQueryMeta({
  sortFields: ['startDate', 'duration', 'pauseDuration', 'status'] as const,
}).extend({
  filters: MatchFilters.optional(),
});
export type MatchQueryMeta = z.infer<typeof MatchQueryMeta>;
