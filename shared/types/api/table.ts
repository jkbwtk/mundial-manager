import z from 'zod';
import { hexColor } from '#shared/zod';

export const Table = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  description: z.string().nullable().default(null),

  side1Color: hexColor,
  side2Color: hexColor,
  location: z.string().nullable().default(null),

  labels: z.array(z.string()).default([]),
});
export type Table = z.infer<typeof Table>;

export const TableCreate = Table.omit({ uuid: true });
export type TableCreate = z.infer<typeof TableCreate>;

export const TableUpdate = TableCreate.partial();
export type TableUpdate = z.infer<typeof TableUpdate>;
