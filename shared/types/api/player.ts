import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { hexColor, PaginatedResponse } from '#shared/zod';

export const Player = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  color: hexColor, // #RRGGBBAA

  labels: z.array(z.string()),
});
export type Player = z.infer<typeof Player>;

export const PlayerPaginated = PaginatedResponse(Player);
export type PlayerPaginated = z.infer<typeof PlayerPaginated>;

export const PlayerNullable = Player.nullable();
export type PlayerNullable = z.infer<typeof PlayerNullable>;

export const PlayerCreate = Player.omit({ uuid: true });
export type PlayerCreate = z.infer<typeof PlayerCreate>;

export const PlayerUpdate = PlayerCreate.partial().extend({ uuid: z.uuid() });
export type PlayerUpdate = z.infer<typeof PlayerUpdate>;

export const PlayerQueryMeta = createQueryMeta({
  sortFields: ['name', 'alias', 'color'] as const,
  searchAvailable: true,
});
export type PlayerQueryMeta = z.infer<typeof PlayerQueryMeta>;
