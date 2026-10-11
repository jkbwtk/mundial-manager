import z from 'zod';
import { Match } from '#shared/types/api/match';
import { Player } from '#shared/types/api/player';
import { Table } from '#shared/types/api/table';
import { uuidArray } from '#shared/zod';

export const MatchSession = z.object({
  key: z.string().nullable(),
  table: Table.nullable(),

  matches: Match.array(),
  players: Player.array(),
});
export type MatchSession = z.infer<typeof MatchSession>;

export const MatchSessionByMatchId = z.object({
  matchUuid: z.uuid(),
});
export type MatchSessionByMatchId = z.infer<typeof MatchSessionByMatchId>;

export const MatchSessionSpectatorsSave = z.object({
  matches: z
    .object({
      uuid: z.uuid(),
      spectators: uuidArray,
    })
    .array()
    .min(1)
    .max(100),
});
export type MatchSessionSpectatorsSave = z.infer<
  typeof MatchSessionSpectatorsSave
>;
