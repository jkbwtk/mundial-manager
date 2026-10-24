import z from 'zod';
import { HeadToHead } from '#shared/types/api/headToHead';
import { MatchTimeline } from '#shared/types/api/matchTimeline';
import { MatchRules, StylePointsConfig } from '#shared/types/api/season';
import { BallStats } from '#shared/types/stats/ballStats';
import { AggregateStats } from '#shared/types/stats/generalStats';
import { LuckStats } from '#shared/types/stats/luckStats';
import { PlayerStats } from '#shared/types/stats/playerStats';
import {
  RatingStats,
  RatingSubject,
  RatingValue,
} from '#shared/types/stats/ratingStats';
import { RatingSystem } from '#shared/types/stats/ratingSystem';
import { TableStats } from '#shared/types/stats/tableStats';

export const StatsPeriodTypeEnum = {
  MATCH: 'MATCH',
  SESSION: 'SESSION',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  SEASON: 'SEASON',
} as const;

export const StatsPeriodType = z.enum(StatsPeriodTypeEnum);
export type StatsPeriodType = z.infer<typeof StatsPeriodType>;

export const StatsPeriodTypes = Object.values(StatsPeriodTypeEnum);

export const StatsPeriod = z.object({
  type: StatsPeriodType,
  key: z.string().max(255).optional(), // latest when omitted
});
export type StatsPeriod = z.infer<typeof StatsPeriod>;

export const StatsVersion = z.string().max(64);
export type StatsVersion = z.infer<typeof StatsVersion>;

export const StatsPeriodsQuery = z.object({
  type: StatsPeriodType,
});
export type StatsPeriodsQuery = z.infer<typeof StatsPeriodsQuery>;

export const StatsPeriods = z.object({
  type: StatsPeriodType,
  keys: z.string().array(),
});
export type StatsPeriods = z.infer<typeof StatsPeriods>;

export const PeriodStatsQuery = z.object({
  period: StatsPeriod.nullable(), // all time when null
});
export type PeriodStatsQuery = z.infer<typeof PeriodStatsQuery>;

export const StatsPeriodInfo = z.object({
  key: z.string().nullable(),
  day: z.string().nullable(), // day of the last match

  index: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});
export type StatsPeriodInfo = z.infer<typeof StatsPeriodInfo>;

export const PlayerStatsEntry = z.object({
  uuid: z.uuid(),
  stats: PlayerStats,
});
export type PlayerStatsEntry = z.infer<typeof PlayerStatsEntry>;

export const TableStatsEntry = z.object({
  uuid: z.uuid(),
  stats: TableStats,
});
export type TableStatsEntry = z.infer<typeof TableStatsEntry>;

export const BallStatsEntry = z.object({
  uuid: z.uuid(),
  stats: BallStats,
});
export type BallStatsEntry = z.infer<typeof BallStatsEntry>;

export const LuckStatsEntry = z.object({
  uuid: z.uuid(),
  stats: LuckStats,
});
export type LuckStatsEntry = z.infer<typeof LuckStatsEntry>;

export const RatingStatsEntry = z.object({
  system: RatingSystem,
  subject: RatingSubject,
  uuid: z.uuid(),
  epoch: z.string(),
  playerUuids: z.uuid().array(),

  rating: RatingStats,
  previous: RatingValue, // before the period
});
export type RatingStatsEntry = z.infer<typeof RatingStatsEntry>;

export const PeriodStats = z.object({
  period: StatsPeriodInfo,

  general: AggregateStats.nullable(),
  players: PlayerStatsEntry.array(),
  tables: TableStatsEntry.array(),
  balls: BallStatsEntry.array(),
  ratings: RatingStatsEntry.array(),
  luck: LuckStatsEntry.array(),
});
export type PeriodStats = z.infer<typeof PeriodStats>;

export const PeriodMatchQuery = z.object({
  period: StatsPeriod,
  offset: z.number().int().nonnegative(),
});
export type PeriodMatchQuery = z.infer<typeof PeriodMatchQuery>;

export const PeriodMatch = z.object({
  timeline: MatchTimeline,

  index: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type PeriodMatch = z.infer<typeof PeriodMatch>;

export const PlayerProfileStatsQuery = z.object({
  playerUuid: z.uuid(),
});
export type PlayerProfileStatsQuery = z.infer<typeof PlayerProfileStatsQuery>;

export const PlayerProfileStats = z.object({
  all: PlayerStats.nullable(),
  today: PlayerStats.nullable(),
  season: PlayerStats.nullable(),

  mostMatchesInSeason: z.number().int().nonnegative(),
  lastMatchDate: z.coerce.date().nullable(),

  ratings: RatingStatsEntry.array(),
  headToHead: HeadToHead.array(),
});
export type PlayerProfileStats = z.infer<typeof PlayerProfileStats>;

export const GeneralStatsSeriesFieldEnum = {
  matches: 'matches',
  cancelledMatches: 'cancelledMatches',
  surrenderedMatches: 'surrenderedMatches',
  goals: 'goals',
  ownGoalCount: 'ownGoalCount',
  playtime: 'playtime',
  participationTime: 'participationTime',
  pauseDuration: 'pauseDuration',
  individualPlaytime: 'individualPlaytime',
  longestTimeBetweenGoals: 'longestTimeBetweenGoals',
  shortestTimeBetweenGoals: 'shortestTimeBetweenGoals',
  leadChanges: 'leadChanges',
  biggestLead: 'biggestLead',
  _totalTimeBetweenGoals: '_totalTimeBetweenGoals',
  _timeBetweenGoalsCount: '_timeBetweenGoalsCount',
  _goalsWithDuration: '_goalsWithDuration',
  _matchesWithDuration: '_matchesWithDuration',
  _matchesWithTimeline: '_matchesWithTimeline',
  _playersWithoutDuration: '_playersWithoutDuration',
} as const satisfies Partial<Record<keyof AggregateStats, string>>;

export const GeneralStatsSeriesField = z.enum(GeneralStatsSeriesFieldEnum);
export type GeneralStatsSeriesField = z.infer<typeof GeneralStatsSeriesField>;

export const GeneralStatsSeriesQuery = z.object({
  type: StatsPeriodType.exclude(['MATCH']),
  fields: GeneralStatsSeriesField.array().min(1).max(20),
});
export type GeneralStatsSeriesQuery = z.infer<typeof GeneralStatsSeriesQuery>;

export const GeneralStatsSeries = z.object({
  keys: z.string().array(),
  values: z.partialRecord(
    GeneralStatsSeriesField,
    z.number().nullable().array(),
  ),
});
export type GeneralStatsSeries = z.infer<typeof GeneralStatsSeries>;

export const RatingHistoryQuery = z.object({
  period: StatsPeriod,
});
export type RatingHistoryQuery = z.infer<typeof RatingHistoryQuery>;

export const RatingHistorySeries = z.object({
  system: RatingSystem,
  subject: RatingSubject,
  subjectUuid: z.uuid(),
  playerUuids: z.uuid().array(),

  points: z.tuple([z.number().int().nonnegative(), z.number()]).array(), // [match index, rating]
});
export type RatingHistorySeries = z.infer<typeof RatingHistorySeries>;

export const RatingHistory = z.object({
  matchStartDates: z.coerce.date().nullable().array(),
  series: RatingHistorySeries.array(),
});
export type RatingHistory = z.infer<typeof RatingHistory>;

export const MatchPredictionQuery = z.object({
  playersSide1: z.uuid().array().min(1).max(8),
  playersSide2: z.uuid().array().min(1).max(8),
});
export type MatchPredictionQuery = z.infer<typeof MatchPredictionQuery>;

export const MatchPredictionPlayer = z.object({
  uuid: z.uuid(),

  rating: z.number(),
  rd: z.number(),
  matches: z.number().int().nonnegative(),
});
export type MatchPredictionPlayer = z.infer<typeof MatchPredictionPlayer>;

export const MatchPrediction = z.object({
  seasonUuid: z.uuid().nullable(),

  rules: MatchRules,
  stylePoints: StylePointsConfig,
  goalTypePoints: z.record(z.uuid(), z.number()),

  goalShare: z.number(), // probability that side 1 scores the next goal
  players: MatchPredictionPlayer.array(),
});
export type MatchPrediction = z.infer<typeof MatchPrediction>;

export const MatchPreviewOutcomeEnum = {
  WIN: 'WIN',
  DRAW: 'DRAW',
  LOSS: 'LOSS',
} as const;

export const MatchPreviewOutcome = z.enum(MatchPreviewOutcomeEnum);
export type MatchPreviewOutcome = z.infer<typeof MatchPreviewOutcome>;

export const LineupHeadToHead = z.object({
  wins: z.number().int().nonnegative(), // side 1 of the query
  draws: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),

  last: z
    .object({
      matchUuid: z.uuid(),
      startDate: z.coerce.date().nullable(),
      score: z.tuple([z.number().int(), z.number().int()]), // side 1 of the query first
      outcome: MatchPreviewOutcome,
    })
    .nullable(),
});
export type LineupHeadToHead = z.infer<typeof LineupHeadToHead>;

export const MatchPreviewPlayer = z.object({
  uuid: z.uuid(),

  elo: z.number().nullable(), // hybrid
  currentWinStreak: z.number().int().nonnegative(),
  currentLossStreak: z.number().int().nonnegative(),
  recent: MatchPreviewOutcome.array().max(5), // newest first
});
export type MatchPreviewPlayer = z.infer<typeof MatchPreviewPlayer>;

export const MatchPreview = z.object({
  prediction: MatchPrediction.nullable(),
  headToHead: LineupHeadToHead,
  players: MatchPreviewPlayer.array(),
});
export type MatchPreview = z.infer<typeof MatchPreview>;
