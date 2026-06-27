import z from 'zod';
import { createQueryMeta } from '#backend/types/trpc';
import { Ball } from '#shared/types/api/ball';
import { Match, MatchCreate } from '#shared/types/api/match';
import {
  MatchEvent,
  MatchEventCreateWithoutMatch,
} from '#shared/types/api/matchEvent';
import { Table } from '#shared/types/api/table';

export const MatchFull = Match.extend({
  table: Table.nullish(),
  ball: Ball.nullish(),

  events: MatchEvent.array(),
});
export type MatchFull = z.infer<typeof MatchFull>;

export const MatchFullCreate = MatchCreate.extend({
  events: MatchEventCreateWithoutMatch.array(),
});
export type MatchFullCreate = z.infer<typeof MatchFullCreate>;

export const MatchFullStrategy = MatchFullCreate.extend({
  uuid: z.uuid().optional(),
});
export type MatchFullStrategy = z.infer<typeof MatchFullStrategy>;

export const MatchFullQueryMeta = createQueryMeta({
  sortFields: [],
});
export type MatchFullQueryMeta = z.infer<typeof MatchFullQueryMeta>;
