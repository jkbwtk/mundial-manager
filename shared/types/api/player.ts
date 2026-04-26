import z from 'zod';
import { hexColor } from '#shared/zod';

export const Player = z.object({
  uuid: z.uuid(),

  name: z.string().max(255),
  alias: z.string().max(16),
  color: hexColor,

  labels: z.array(z.string()).default([]),
});
export type Player = z.infer<typeof Player>;

export const PlayerCreate = Player.omit({ uuid: true });
export type PlayerCreate = z.infer<typeof PlayerCreate>;

export const PlayerUpdate = PlayerCreate.partial();
export type PlayerUpdate = z.infer<typeof PlayerUpdate>;
