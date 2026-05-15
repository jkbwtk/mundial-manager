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

export const MatchEventTypeEnum = {
  GOAL: 'GOAL',
  POSITION_CHANGE: 'POSITION_CHANGE',
  BALL_OUT: 'BALL_OUT',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  CANCEL: 'CANCEL',
} as const;

export const MatchEventType = z.enum(MatchEventTypeEnum);

export type MatchEventType = z.infer<typeof MatchEventType>;

const MatchEventBase = z.object({
  time: z.number().int(), // unix timestamp
});

export const GoalTypeEnum = {
  AERIAL_GOAL: 'AERIAL_GOAL', // A goal scored by bouncing the ball off the rod or other non-figurine part of the table
  BACK_STAB_GOAL: 'BACK_STAB_GOAL', // A goal scored by bouncing the ball off the back of the opponent's figurine
  PARRY_GOAL: 'PARRY_GOAL', // A goal scored by parrying the ball kicked by the opponent into the goal
  RETURN_TO_FIELD_GOAL: 'RETURN_TO_FIELD_GOAL', // A goal scored in a way that causes the ball to return to the field after crossing the goal line
  TRICK_SHOT_GOAL: 'TRICK_SHOT_GOAL', // A goal scored by performing a trick shot, such as bouncing the ball off multiple figurines or the table
  LONG_SHOT_GOAL: 'LONG_SHOT_GOAL', // A goal scored from a long distance
  SLOW_GOAL: 'SLOW_GOAL', // A goal scored by slowly kicking the ball into the goal, catching the opponent off guard
  FAST_GOAL: 'FAST_GOAL', // A goal scored by quickly kicking the ball into the goal, overwhelming the opponent
  GUARD_PIERCE_GOAL: 'GUARD_PIERCE_GOAL', // A goal scored in a way that spun opponent's unheld or weakly held rod out of the way
  PUSH_GOAL: 'PUSH_GOAL', // A goal scored by pushing the ball without making any audible sound or noticeable movement
  BERMUDA_TRIANGLE_GOAL: 'BERMUDA_TRIANGLE_GOAL', // A goal scored directly after the ball hits one or both goalposts of the scoring side's goal
} as const;

export const GoalType = z.enum(GoalTypeEnum);

export type GoalType = z.infer<typeof GoalType>;

export const MatchEventGoal = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.GOAL),
  for: z.string(), // team color
  by: z.string(), //team color
  player: z.string().nullable().catch(null),
  goalType: z.array(GoalType).catch([]),
});

export type MatchEventGoal = z.infer<typeof MatchEventGoal>;

export const MatchEventPositionChange = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.POSITION_CHANGE),
  side: z.string(), // team color
});

export type MatchEventPositionChange = z.infer<typeof MatchEventPositionChange>;

export const MatchEventBallOut = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.BALL_OUT),
});

export type MatchEventBallOut = z.infer<typeof MatchEventBallOut>;

export const MatchEventEquipmentFailure = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.EQUIPMENT_FAILURE),
  details: z.string().nullable().catch(null),
});

export type MatchEventEquipmentFailure = z.infer<
  typeof MatchEventEquipmentFailure
>;

export const MatchEventPause = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.PAUSE),
  reason: z.string().nullable().catch(null),
});

export type MatchEventPause = z.infer<typeof MatchEventPause>;

export const MatchEventResume = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.RESUME),
});

export type MatchEventResume = z.infer<typeof MatchEventResume>;

export const MatchEventCancel = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.CANCEL),
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
