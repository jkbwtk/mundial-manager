import z from 'zod';

export const PaginationInput = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type PaginationInput = z.infer<typeof PaginationInput>;
