import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Labels } from '#shared/labels';
import { hexColor, PaginatedResponse } from '#shared/zod';

export const GoalTypeKey = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Z0-9_]+$/, 'GOAL_TYPE_KEY_INVALID');
export type GoalTypeKey = z.infer<typeof GoalTypeKey>;

export const GoalType = z.object({
  uuid: z.uuid(),
  parentUuid: z.uuid().nullish(),

  key: GoalTypeKey,
  name: z.string().max(255),
  description: z.string().max(1024).nullish(),

  icon: z.string().max(16).nullish(), // emoji
  color: hexColor.nullish(), // #RRGGBBAA
  stylePoints: z.int().nonnegative().default(0),

  labels: Labels,
});
export type GoalType = z.infer<typeof GoalType>;

export const GoalTypePaginated = PaginatedResponse(GoalType);
export type GoalTypePaginated = z.infer<typeof GoalTypePaginated>;

export const GoalTypeNullable = GoalType.nullable();
export type GoalTypeNullable = z.infer<typeof GoalTypeNullable>;

export const GoalTypeCreate = GoalType.omit({ uuid: true });
export type GoalTypeCreate = z.infer<typeof GoalTypeCreate>;

export const GoalTypeUpdate = GoalTypeCreate.partial().extend({
  uuid: z.uuid(),
});
export type GoalTypeUpdate = z.infer<typeof GoalTypeUpdate>;

export const GoalTypeQueryMeta = createQueryMeta({
  sortFields: ['key', 'name', 'stylePoints'] as const,
  searchAvailable: true,
});
export type GoalTypeQueryMeta = z.infer<typeof GoalTypeQueryMeta>;
