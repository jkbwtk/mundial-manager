import z from 'zod';

export const Pagination = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof Pagination>;
