import z from 'zod';
import { playerCreateDefaults } from '#shared/defaults/player';
import { Labels } from '#shared/labels';
import { createQueryMeta } from '#shared/types/api/queryMeta';
import { hexColor, PaginatedResponse, withDefaults } from '#shared/zod';

export const Player = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  color: hexColor, // #RRGGBBAA

  disabled: z.boolean(),

  labels: Labels,
});
export type Player = z.infer<typeof Player>;

export const PlayerPaginated = PaginatedResponse(Player);
export type PlayerPaginated = z.infer<typeof PlayerPaginated>;

export const PlayerNullable = Player.nullable();
export type PlayerNullable = z.infer<typeof PlayerNullable>;

export const PlayerCreate = withDefaults(
  Player.omit({ uuid: true }),
  playerCreateDefaults,
);
export type PlayerCreate = z.infer<typeof PlayerCreate>;

export const PlayerUpdate = Player.omit({ uuid: true })
  .partial()
  .extend({ uuid: z.uuid() });
export type PlayerUpdate = z.infer<typeof PlayerUpdate>;

export const PlayerQueryMeta = createQueryMeta({
  sortFields: ['name', 'alias', 'color', 'disabled'] as const,
  searchAvailable: true,
});
export type PlayerQueryMeta = z.infer<typeof PlayerQueryMeta>;
