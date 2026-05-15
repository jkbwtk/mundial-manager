import z from 'zod';

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
  time: z.date(),
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
  for: z.uuid(), // match side uuid
  by: z.uuid(), // match side uuid
  player: z.uuid(), // player uuid
  goalType: z.array(GoalType).default([]),
});
export type MatchEventGoal = z.infer<typeof MatchEventGoal>;

export const MatchEventPositionChange = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.POSITION_CHANGE),
  side: z.uuid(), // match side uuid
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
