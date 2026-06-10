import z from 'zod';

export interface QueryMetaOptions<
  SortFields extends string[],
  SearchAvailable extends boolean = false,
> {
  sortFields: SortFields;
  searchAvailable?: SearchAvailable;
}

export const Pagination = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type Pagination = z.infer<typeof Pagination>;

export function createQueryMeta<
  SortFields extends string[],
  SearchAvailable extends boolean = false,
>(options: QueryMetaOptions<SortFields, SearchAvailable>) {
  const queryMeta = z.object({
    pagination: Pagination.optional(),
    sorting: z
      .object({
        field: z.enum(options.sortFields),
        direction: z.enum(['asc', 'desc']),
      })
      .optional(),
    search: (options.searchAvailable
      ? z.string().optional()
      : z.never().optional()) as SearchAvailable extends true
      ? z.ZodOptional<z.ZodString>
      : z.ZodOptional<z.ZodNever>,
  });

  return queryMeta;
}

export type QueryMetaSchema = ReturnType<typeof createQueryMeta>;
export type QueryMeta = z.infer<QueryMetaSchema>;
