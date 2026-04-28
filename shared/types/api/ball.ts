import z from 'zod';
import { hexColor } from '#shared/zod';

export const Ball = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  description: z.string().optional(),

  color: hexColor,
  diameter: z.number().positive(), // millimeters
  weight: z.number().positive(), // grams

  labels: z.array(z.string()).default([]),
});
export type Ball = z.infer<typeof Ball>;

export const BallCreate = Ball.omit({ uuid: true });
export type BallCreate = z.infer<typeof BallCreate>;

export const BallUpdate = BallCreate.partial();
export type BallUpdate = z.infer<typeof BallUpdate>;
