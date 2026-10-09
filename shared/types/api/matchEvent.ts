import z from 'zod';
import { Labels } from '#shared/labels';

export const MatchSideEnum = {
  SIDE_1: 'SIDE_1',
  SIDE_2: 'SIDE_2',
} as const;

export const MatchSide = z.enum(MatchSideEnum);
export type MatchSide = z.infer<typeof MatchSide>;

export const MatchSides = Object.values(MatchSideEnum);

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

  offset: z.number().int(),

  labels: Labels,
});

export const MatchEventGoal = MatchEventBase.extend({
  type: z.literal(MatchEventTypeEnum.GOAL),
  player: z.uuid(), // player uuid
  ownGoal: z.boolean(),
  side: MatchSide, // duplicates data but reduces code complexity
  goalType: z.array(z.uuid()).default([]), // goal type uuids
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
  countsAsPresence: z.boolean().default(false),
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
  MatchEventBallChange,
  MatchEventEquipmentFailure,
  MatchEventPause,
  MatchEventResume,
  MatchEventCancel,
]);
export type MatchEvent = z.infer<typeof MatchEvent>;

export const MatchEventCreate = z.discriminatedUnion('type', [
  MatchEventGoal.omit({ uuid: true }),
  MatchEventPositionChange.omit({ uuid: true }),
  MatchEventBallOut.omit({ uuid: true }),
  MatchEventBallChange.omit({ uuid: true }),
  MatchEventEquipmentFailure.omit({ uuid: true }),
  MatchEventPause.omit({ uuid: true }),
  MatchEventResume.omit({ uuid: true }),
  MatchEventCancel.omit({ uuid: true }),
]);
export type MatchEventCreate = z.infer<typeof MatchEventCreate>;
