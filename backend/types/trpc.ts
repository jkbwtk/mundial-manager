import z from 'zod';

export interface QueryMetaOptions<SortFields extends string[]> {
  sortFields: SortFields;
}

export const Pagination = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof Pagination>;

export function createQueryMeta<SortFields extends string[]>(
  options: QueryMetaOptions<SortFields>,
) {
  return z.object({
    pagination: Pagination.optional(),
    sorting: z
      .object({
        field: z.enum(options.sortFields),
        direction: z.enum(['asc', 'desc']),
      })
      .optional(),
  });
}

export type QueryMetaSchema = ReturnType<typeof createQueryMeta>;
export type QueryMeta = z.infer<QueryMetaSchema>;
