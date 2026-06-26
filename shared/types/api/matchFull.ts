import z from 'zod';
import { MatchCreate } from '#shared/types/api/match';
import { MatchEventCreateWithoutMatch } from '#shared/types/api/matchEvent';

export const MatchFullCreate = MatchCreate.extend({
  events: MatchEventCreateWithoutMatch.array(),
});
export type MatchFullCreate = z.infer<typeof MatchFullCreate>;

export const MatchFullStrategy = MatchFullCreate.extend({
  uuid: z.uuid().optional(),
});
export type MatchFullStrategy = z.infer<typeof MatchFullStrategy>;
