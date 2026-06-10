import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { hexColor, PaginatedResponse } from '#shared/zod';

export const Ball = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  description: z.string().nullish(),

  color: hexColor.nullish(), // #RRGGBBAA
  diameter: z.number().positive().nullish(), // millimeters
  weight: z.number().positive().nullish(), // grams

  labels: z.array(z.string()),
});
export type Ball = z.infer<typeof Ball>;

export const BallPaginated = PaginatedResponse(Ball);
export type BallPaginated = z.infer<typeof BallPaginated>;

export const BallNullable = Ball.nullable();
export type BallNullable = z.infer<typeof BallNullable>;

export const BallCreate = Ball.omit({ uuid: true });
export type BallCreate = z.infer<typeof BallCreate>;

export const BallUpdate = BallCreate.partial().extend({ uuid: z.uuid() });
export type BallUpdate = z.infer<typeof BallUpdate>;

export const BallQueryMeta = createQueryMeta({
  sortFields: [
    'name',
    'alias',
    'description',
    'color',
    'diameter',
    'weight',
  ] as const,
  searchAvailable: true,
});
export type BallQueryMeta = z.infer<typeof BallQueryMeta>;
