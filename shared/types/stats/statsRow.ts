import type { GoalType } from '#shared/types/api/goalType';
import type { Match } from '#shared/types/api/match';
import type { MatchEvent, MatchSide } from '#shared/types/api/matchEvent';
import type { MatchRules } from '#shared/types/api/season';
import type { BallStats } from '#shared/types/stats/ballStats';
import type {
  StatsSeason,
  StatsSessionState,
} from '#shared/types/stats/bucket';
import type { AggregateStats } from '#shared/types/stats/generalStats';
import type {
  RatingStats,
  RatingSubject,
  RatingValue,
} from '#shared/types/stats/ratingStats';
import type { RatingSystem } from '#shared/types/stats/ratingSystem';

export interface StatsMatch extends Match {
  side1TeamConfigurationUuid: string;
  side2TeamConfigurationUuid: string;

  events: MatchEvent[];
}

export type StatsGoalType = Pick<GoalType, 'uuid' | 'stylePoints'>;

export interface StatsInput {
  timeZone: string;

  seasons: StatsSeason[];
  goalTypes: StatsGoalType[];
}

export type StatsRowMatch = Omit<StatsMatch, 'events' | 'labels'>;

export interface StatsRowPlayer {
  uuid: string;
  side: MatchSide | null; // null for spectators

  presence: number; // milliseconds

  goals: number;
  ownGoals: number;
  goalTypes: string[];
  stylePoints: number;
}

export interface StatsRowBall {
  uuid: string;
  stats: BallStats;
}

export interface StatsRatingChange {
  system: RatingSystem;
  subject: RatingSubject;
  uuid: string;
  epoch: string;

  before: RatingValue;
  after: RatingStats;
}

export interface StatsRowLuck {
  rules: MatchRules;

  expectedWins: [side1: number, side2: number];
  winner: MatchSide | null;
  comeback: { probability: number; score: string } | null;
}

export interface StatsRow {
  index: number;
  match: StatsRowMatch;

  day: string | null; // YYYY-MM-DD in the league timezone
  seasonKey: string;
  sessionKey: string | null;
  ratingEpoch: string;

  general: AggregateStats;
  players: StatsRowPlayer[];
  balls: StatsRowBall[];
  winningSide: MatchSide | null;

  ratings: StatsRatingChange[];
  luck: StatsRowLuck | null;
}

export interface StatsPeriodRows {
  key: string | null;
  index: number;
  count: number;

  rows: StatsRow[];
}

export interface StatsRatingState {
  epoch: string;
  state: unknown;
  ratings: Map<string, RatingStats>;
}

export interface StatsEngine {
  input: StatsInput;
  stylePoints: Map<string, number>;

  index: number;
  day: number; // whole days since the epoch
  seasonKey: string | null;
  sessions: Record<string, StatsSessionState>;

  ratingSeasonUuid: string | null;
  ratingEpoch: string;
  ratings: Map<string, StatsRatingState>;
}
