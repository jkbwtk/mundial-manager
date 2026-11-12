import type { Player } from '#shared/types/api/player';
import type { DeepPartial } from '#shared/zod';

export const playerCreateDefaults = {
  disabled: false,
} satisfies DeepPartial<Player>;
