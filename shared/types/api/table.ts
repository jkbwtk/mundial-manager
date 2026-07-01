import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Labels } from '#shared/labels';
import { hexColor, PaginatedResponse } from '#shared/zod';

export const Table = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  description: z.string().nullish(),

  side1Color: hexColor,
  side2Color: hexColor,
  location: z.string().nullish(),

  labels: Labels,
});
export type Table = z.infer<typeof Table>;

export const TablePaginated = PaginatedResponse(Table);
export type TablePaginated = z.infer<typeof TablePaginated>;

export const TableNullable = Table.nullable();
export type TableNullable = z.infer<typeof TableNullable>;

export const TableCreate = Table.omit({ uuid: true });
export type TableCreate = z.infer<typeof TableCreate>;

export const TableUpdate = TableCreate.partial().extend({ uuid: z.uuid() });
export type TableUpdate = z.infer<typeof TableUpdate>;

export const TableStrategy = TableCreate.extend({
  uuid: z.uuid().optional(),
});
export type TableStrategy = z.infer<typeof TableStrategy>;

export const TableQueryMeta = createQueryMeta({
  sortFields: ['name', 'alias', 'description', 'location'] as const,
  searchAvailable: true,
});
export type TableQueryMeta = z.infer<typeof TableQueryMeta>;
