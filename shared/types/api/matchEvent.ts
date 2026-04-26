import z from 'zod';

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
  time: z.date(),
});

export const MatchEventGoal = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.GOAL),
  for: z.uuid(), // match side uuid
  by: z.uuid(), // match side uuid
  player: z.uuid(), // player uuid
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
