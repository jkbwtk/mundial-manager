import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { PaginatedResponse } from '#shared/zod';

export const MatchSideEnum = {
  SIDE_1: 'SIDE_1',
  SIDE_2: 'SIDE_2',
} as const;

export const MatchSide = z.enum(MatchSideEnum);
export type MatchSide = z.infer<typeof MatchSide>;

export const MatchEventTypeEnum = {
  GOAL: 'GOAL',
  POSITION_CHANGE: 'POSITION_CHANGE',
  BALL_OUT: 'BALL_OUT',
  BALL_CHANGE: 'BALL_CHANGE',
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  PAUSE: 'PAUSE',
  RESUME: 'RESUME',
  CANCEL: 'CANCEL',
} as const;

export const MatchEventType = z.enum(MatchEventTypeEnum);
export type MatchEventType = z.infer<typeof MatchEventType>;

const MatchEventBase = z.object({
  uuid: z.uuid(),
  matchUuid: z.uuid(),
  time: z.coerce.date(),
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
  player: z.uuid(), // player uuid
  ownGoal: z.boolean(),
  goalType: z.array(GoalType).default([]),
});
export type MatchEventGoal = z.infer<typeof MatchEventGoal>;

export const MatchEventPositionChange = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.POSITION_CHANGE),
  side: MatchSide,
});
export type MatchEventPositionChange = z.infer<typeof MatchEventPositionChange>;

export const MatchEventBallOut = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.BALL_OUT),
});
export type MatchEventBallOut = z.infer<typeof MatchEventBallOut>;

export const MatchEventBallChange = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.BALL_CHANGE),
  ball: z.uuid(), // ball uuid
});
export type MatchEventBallChange = z.infer<typeof MatchEventBallChange>;

export const MatchEventEquipmentFailure = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.EQUIPMENT_FAILURE),
  details: z.string().nullable().default(null),
});
export type MatchEventEquipmentFailure = z.infer<
  typeof MatchEventEquipmentFailure
>;

export const MatchEventPause = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.PAUSE),
  details: z.string().nullable().default(null),
});
export type MatchEventPause = z.infer<typeof MatchEventPause>;

export const MatchEventResume = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.RESUME),
});
export type MatchEventResume = z.infer<typeof MatchEventResume>;

export const MatchEventCancel = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.CANCEL),
  details: z.string().nullable().default(null),
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

export const MatchEventPaginated = PaginatedResponse(MatchEvent);
export type MatchEventPaginated = z.infer<typeof MatchEventPaginated>;

export const MatchEventNullable = MatchEvent.nullable();
export type MatchEventNullable = z.infer<typeof MatchEventNullable>;

export const MatchEventCreate = z.discriminatedUnion('type', [
  MatchEventGoal.omit({ uuid: true }),
  MatchEventPositionChange.omit({ uuid: true }),
  MatchEventBallOut.omit({ uuid: true }),
  MatchEventEquipmentFailure.omit({ uuid: true }),
  MatchEventPause.omit({ uuid: true }),
  MatchEventResume.omit({ uuid: true }),
  MatchEventCancel.omit({ uuid: true }),
]);
export type MatchEventCreate = z.infer<typeof MatchEventCreate>;

export const MatchEventUpdate = z.discriminatedUnion('type', [
  MatchEventGoal.omit({ uuid: true }).partial().extend({ uuid: z.uuid() }),
  MatchEventPositionChange.omit({ uuid: true })
    .partial()
    .extend({ uuid: z.uuid() }),
  MatchEventBallOut.omit({ uuid: true }).partial().extend({ uuid: z.uuid() }),
  MatchEventEquipmentFailure.omit({ uuid: true })
    .partial()
    .extend({ uuid: z.uuid() }),
  MatchEventPause.omit({ uuid: true }).partial().extend({ uuid: z.uuid() }),
  MatchEventResume.omit({ uuid: true }).partial().extend({ uuid: z.uuid() }),
  MatchEventCancel.omit({ uuid: true }).partial().extend({ uuid: z.uuid() }),
]);
export type MatchEventUpdate = z.infer<typeof MatchEventUpdate>;

export const MatchEventQueryMeta = createQueryMeta({
  sortFields: ['time'] as const,
});
export type MatchEventQueryMeta = z.infer<typeof MatchEventQueryMeta>;
