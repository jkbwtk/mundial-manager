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
