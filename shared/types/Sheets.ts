import dayjs from 'dayjs';
import z from 'zod';
import { jsonCodec } from '#shared/zod';

export interface SheetMetadata {
  title: string;
  timezone: string;
  locale: string;
  rows: number;
  columns: number;
}

export const MatchEventType = z.enum([
  'GOAL',
  'POSITION_CHANGE',
  'BALL_OUT',
  'EQUIPMENT_FAILURE',
]);

export type MatchEventType = z.infer<typeof MatchEventType>;

const MatchEventBase = z.object({
  time: z.number().int(), // unix timestamp
});

export const MatchEventGoal = MatchEventBase.extend({
  type: z.literal('GOAL'),
  for: z.string(), // team color
  by: z.string(), //team color
  player: z.string().nullable().catch(null),
});

export type MatchEventGoal = z.infer<typeof MatchEventGoal>;

export const MatchEventPositionChange = MatchEventBase.extend({
  type: z.literal('POSITION_CHANGE'),
  side: z.string(), // team color
});

export type MatchEventPositionChange = z.infer<typeof MatchEventPositionChange>;

export const MatchEventBallOut = MatchEventBase.extend({
  type: z.literal('BALL_OUT'),
});

export type MatchEventBallOut = z.infer<typeof MatchEventBallOut>;

export const MatchEventEquipmentFailure = MatchEventBase.extend({
  type: z.literal('EQUIPMENT_FAILURE'),
  details: z.string().nullable().catch(null),
});

export type MatchEventEquipmentFailure = z.infer<
  typeof MatchEventEquipmentFailure
>;

export const MatchEventPause = MatchEventBase.extend({
  type: z.literal('PAUSE'),
  reason: z.string().nullable().catch(null),
});

export type MatchEventPause = z.infer<typeof MatchEventPause>;

export const MatchEventResume = MatchEventBase.extend({
  type: z.literal('RESUME'),
});

export type MatchEventResume = z.infer<typeof MatchEventResume>;

export const MatchEventCancel = MatchEventBase.extend({
  type: z.literal('CANCEL'),
  reason: z.string().nullable().catch(null),
});

export type MatchEventCancel = z.infer<typeof MatchEventCancel>;

export const MatchEvent = z.discriminatedUnion('type', [
  MatchEventGoal,
  MatchEventPositionChange,
  MatchEventBallOut,
  MatchEventEquipmentFailure,
  MatchEventPause,
  MatchEventResume,
  MatchEventCancel,
]);

export type MatchEvent = z.infer<typeof MatchEvent>;

export const MatchReplayMetadata = z.object({
  startedAt: z.number().int(), // unix timestamp
  events: z.codec(
    z.array(MatchEvent.nullable().catch(null)),
    z.array(MatchEvent),
    {
      decode: (val) => val.filter((e) => e !== null),
      encode: (val) => val,
    },
  ),
});

export type MatchReplayMetadata = z.infer<typeof MatchReplayMetadata>;

export const NormalizedTeamName = z
  .string()
  .transform((team) => team.split(/\s+/g).sort().join(' '))
  .brand<'NormalizedTeamName'>();

export type NormalizedTeamName = z.infer<typeof NormalizedTeamName>;

export const Match = z.object({
  id: z.number().int().nonnegative(),
  team1: z.string(),
  team2: z.string(),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
  floor: z.number().int().optional().nullable().default(null).catch(null),
  winningColor: z.string().optional().default('unknown').catch('unknown'),
  duration: z.codec(
    z.number().optional().nullable().default(null).catch(null),
    z.number().optional().nullable().default(null),
    {
      decode: (val) => (val ? val * 24 * 60 : null),
      encode: (val) => (val ? Math.fround(val / (24 * 60)) : null),
    },
  ),
  pauseDuration: z.number(),
  date: z.codec(
    z.number().int().optional().nullable().default(null).catch(null),
    z.number().int().optional().nullable().default(null),
    {
      decode: (val) =>
        val ? dayjs('1899-12-30T12:00:00Z').add(val, 'days').unix() : null,
      encode: (val) =>
        val
          ? dayjs
              .unix(val)
              .hour(11)
              .diff(dayjs('1899-12-30T12:00:00Z'), 'days') + 1
          : null,
    },
  ),
  replayMetadata: jsonCodec(MatchReplayMetadata).nullable().catch(null),
  hash: z.string(),
});

export type Match = z.infer<typeof Match>;

export const MatchWithoutMetadata = Match.omit({
  id: true,
  hash: true,
  pauseDuration: true,
});

export type MatchWithoutMetadata = z.infer<typeof MatchWithoutMetadata>;

export const MatchCreate = Match.omit({
  id: true,
  floor: true,
  hash: true,
  pauseDuration: true,
});

export type MatchCreate = z.infer<typeof MatchCreate>;
