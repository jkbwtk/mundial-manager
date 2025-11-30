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

export const MatchEvent = z.discriminatedUnion('type', [
  MatchEventGoal,
  MatchEventPositionChange,
  MatchEventBallOut,
  MatchEventEquipmentFailure,
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

const NormalizedTeamName = z.codec(z.string(), z.string(), {
  decode: (str) => str.split(/\s+/g).sort().join(' '),
  encode: (str) => str,
});

export const Match = z.object({
  id: z.number().int().nonnegative(),
  team1: NormalizedTeamName,
  team2: NormalizedTeamName,
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
  floor: z.number().int().optional().nullable().default(null).catch(null),
  winningColor: z.string().optional().default('unknown').catch('unknown'),
  duration: z.codec(
    z.number().optional().nullable().default(null).catch(null),
    z.number().optional().nullable().default(null),
    {
      decode: (val) => (val ? val * 24 * 60 : null),
      encode: (val) => (val ? val / (24 * 60) : null),
    },
  ),
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
});

export type Match = z.infer<typeof Match>;

export type MatchWithoutId = Omit<Match, 'id'>;

export const MatchCreate = Match.omit({ id: true, floor: true });

export type MatchCreate = z.infer<typeof MatchCreate>;
