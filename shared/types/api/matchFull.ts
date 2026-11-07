import type z from 'zod';
import { MatchCreate } from '#shared/types/api/match';
import { MatchEvent } from '#shared/types/api/matchEvent';

export const MatchFullCreate = MatchCreate.extend({
  events: MatchEvent.array(),
});
export type MatchFullCreate = z.infer<typeof MatchFullCreate>;
