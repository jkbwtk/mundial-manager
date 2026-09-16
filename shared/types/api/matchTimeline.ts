import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Ball } from '#shared/types/api/ball';
import { Match } from '#shared/types/api/match';
import { MatchEvent } from '#shared/types/api/matchEvent';
import { Player } from '#shared/types/api/player';
import { Table } from '#shared/types/api/table';

export const MatchTimelineIssueSeverityEnum = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
} as const;

export const MatchTimelineIssueSeverity = z.enum(
  MatchTimelineIssueSeverityEnum,
);
export type MatchTimelineIssueSeverity = z.infer<
  typeof MatchTimelineIssueSeverity
>;

export const MatchTimelineErrorTypeEnum = {
  DUPLICATE_EVENT_UUID: 'DUPLICATE_EVENT_UUID',
  EVENT_BEFORE_MATCH_START: 'EVENT_BEFORE_MATCH_START',
  EVENT_AFTER_MATCH_END: 'EVENT_AFTER_MATCH_END',
  CANCEL_DUPLICATE: 'CANCEL_DUPLICATE',
  EVENT_AFTER_CANCEL: 'EVENT_AFTER_CANCEL',
  PAUSE_ALREADY_ACTIVE: 'PAUSE_ALREADY_ACTIVE',
  RESUME_WITHOUT_PAUSE: 'RESUME_WITHOUT_PAUSE',
  PAUSE_NOT_RESUMED: 'PAUSE_NOT_RESUMED',
  EVENT_DURING_PAUSE: 'EVENT_DURING_PAUSE',
  GOAL_PLAYER_NOT_IN_SIDE: 'GOAL_PLAYER_NOT_IN_SIDE',
  GOAL_TYPE_DUPLICATE: 'GOAL_TYPE_DUPLICATE',
  PLAYERS_NOT_FOUND: 'PLAYERS_NOT_FOUND',
  BALL_NOT_FOUND: 'BALL_NOT_FOUND',
  MATCH_NOT_FOUND: 'MATCH_NOT_FOUND',
} as const;

export const MatchTimelineErrorType = z.enum(MatchTimelineErrorTypeEnum);
export type MatchTimelineErrorType = z.infer<typeof MatchTimelineErrorType>;

export const MatchTimelineIssue = z.object({
  severity: MatchTimelineIssueSeverity,
  errorType: MatchTimelineErrorType,

  eventUuid: z.string().nullable(),
  eventIndex: z.number().int().nonnegative().nullable(),
  field: z.string().nullable(),
});
export type MatchTimelineIssue = z.infer<typeof MatchTimelineIssue>;

export const MatchTimeline = z.object({
  match: Match,
  table: Table.nullable(),
  events: MatchEvent.array(),

  players: Player.array(),
  balls: Ball.array(),

  issues: MatchTimelineIssue.array(),
});
export type MatchTimeline = z.infer<typeof MatchTimeline>;

export const MatchTimelineQueryMeta = createQueryMeta({
  sortFields: [],
});
export type MatchTimelineQueryMeta = z.infer<typeof MatchTimelineQueryMeta>;

export const MatchTimelineByMatchId = z.object({
  matchUuid: z.uuid(),
});
export type MatchTimelineByMatchId = z.infer<typeof MatchTimelineByMatchId>;

export const MatchTimelineSave = z.object({
  matchUuid: z.uuid(),
  events: MatchEvent.array().max(1000),
});
export type MatchTimelineSave = z.infer<typeof MatchTimelineSave>;
