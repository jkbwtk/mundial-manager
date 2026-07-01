import z from 'zod';
import type { Ball } from '#shared/types/api/ball';
import type { Match, MatchCreate, MatchUpdate } from '#shared/types/api/match';
import type {
  MatchEvent,
  MatchEventCreate,
  MatchEventUpdate,
} from '#shared/types/api/matchEvent';
import type { Player } from '#shared/types/api/player';
import type { Table } from '#shared/types/api/table';
import { MatchEvent as LegacyMatchEvent } from '#shared/types/Sheets';

export const CalculatorFinishEvent = z.object({
  startedAt: z.number().int(), // unix timestamp

  events: z
    .array(LegacyMatchEvent)
    .optional()
    .nullable()
    .default(null)
    .catch(null),
  history: z.array(z.string()).optional().nullable().default(null).catch(null),

  scores: z.tuple([z.number().int(), z.number().int()]),
  teams: z.tuple([z.array(z.string()), z.array(z.string())]),
});

export type CalculatorFinishEvent = z.infer<typeof CalculatorFinishEvent>;

export type CalculatorApi = {
  getTables(): Promise<Table[]>;
  getBalls(): Promise<Ball[]>;
  getPlayers(): Promise<Player[]>;

  // TODO: add getGoalTypes endpoint
  // TODO: expose season and league info
  // TODO: add live match predictions endpoint

  createLegacyMatch(legacyMatch: CalculatorFinishEvent): void;

  createMatch(match: MatchCreate): Promise<Match>;
  updateMatch(match: MatchUpdate): Promise<Match>;
  deleteMatch(uuid: string): Promise<Match>;

  createEvent(event: MatchEventCreate): Promise<MatchEvent>;
  updateEvent(event: MatchEventUpdate): Promise<MatchEvent>;
  deleteEvent(uuid: string): Promise<MatchEvent>;
};
