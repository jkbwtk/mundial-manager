import type { Match } from '#shared/types/api/match';
import type { DeepPartial } from '#shared/zod';

export const matchCreateDefaults = {
  startDate: null,

  duration: null,
  pauseDuration: 0,

  side1Score: 0,
  side2Score: 0,

  status: 'SCHEDULED',

  hidden: false,

  stakesModifier: 1,

  syncId: null,
} satisfies DeepPartial<Match>;
