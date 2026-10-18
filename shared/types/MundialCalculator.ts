import z from 'zod';
import type { Ball } from '#shared/types/api/ball';
import type { GoalType } from '#shared/types/api/goalType';
import type { League } from '#shared/types/api/league';
import type { Match, MatchCreate, MatchUpdate } from '#shared/types/api/match';
import { MatchEventGoal } from '#shared/types/api/matchEvent';
import type {
  MatchTimeline,
  MatchTimelineSave,
} from '#shared/types/api/matchTimeline';
import type { Player } from '#shared/types/api/player';
import type { Season } from '#shared/types/api/season';
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

export const LiveMatchGoal = MatchEventGoal.pick({
  player: true,
  side: true,
  ownGoal: true,
  goalType: true,
});
export type LiveMatchGoal = z.infer<typeof LiveMatchGoal>;

export const LiveMatchPredictionInput = z.object({
  playersSide1: z.uuid().array().min(1).max(8),
  playersSide2: z.uuid().array().min(1).max(8),

  goals: LiveMatchGoal.array().max(200), // in order
});
export type LiveMatchPredictionInput = z.infer<typeof LiveMatchPredictionInput>;

export interface LiveMatchPrediction {
  score: [side1: number, side2: number];

  winProbability: number; // side 1, at the current score
  preMatchWinProbability: number; // side 1
  expectedScore: {
    score: [side1: number, side2: number];
    probability: number;
  };

  stylePoints: Record<string, number>;
}

export type CalculatorApi = {
  getTables(): Promise<Table[]>;
  getBalls(): Promise<Ball[]>;
  getPlayers(): Promise<Player[]>;
  getGoalTypes(): Promise<GoalType[]>;

  getActiveLeague(): Promise<League | null>;
  getCurrentSeason(): Promise<Season | null>;

  getMatchPrediction(
    input: LiveMatchPredictionInput,
  ): Promise<LiveMatchPrediction | null>;

  createLegacyMatch(legacyMatch: CalculatorFinishEvent): void;

  createMatch(match: MatchCreate): Promise<Match>;
  updateMatch(match: MatchUpdate): Promise<Match>;
  deleteMatch(uuid: string): Promise<Match>;

  saveMatchTimeline(timeline: MatchTimelineSave): Promise<MatchTimeline>;
};
