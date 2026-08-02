import z from 'zod';
import { GoalType } from '#shared/types/api/matchEvent';

export const BaseStats = z.object({
  label: z.string(),

  averageTimeBetweenGoals: z.number().nonnegative().nullable(),
  // averageTimeBetweenGoalsFormatted: string;

  longestTimeBetweenGoals: z.number().nonnegative().nullable(),
  // longestTimeBetweenGoalsFormatted: string;

  shortestTimeBetweenGoals: z.number().nonnegative().nullable(),
  // shortestTimeBetweenGoalsFormatted: string;

  goalsPerMinute: z.number().nonnegative().nullable(),

  ballOutCount: z.number().int().nonnegative().nullable(),
  positionChangeCount: z.number().int().nonnegative().nullable(),
  ownGoalCount: z.number().int().nonnegative().nullable(),

  goalTypesCount: z.record(GoalType, z.number().int().nonnegative()),

  _matchCounter: z.number().int().nonnegative(),
  _goalsWithDuration: z.number().int().nonnegative(),
  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
  _matchesWithGoalTypes: z.number().int().nonnegative(),
});
export type BaseStats = z.infer<typeof BaseStats>;

export const MatchStats = BaseStats;
export type MatchStats = z.infer<typeof MatchStats>;

export const AggregateStats = BaseStats.extend({
  // players:   string[];
  // teams:   string[];

  matches: z.number().int().nonnegative(),
  goals: z.number().int().nonnegative(),

  playtime: z.number().nonnegative(),
  // playtimeFormatted: string;

  individualPlaytime: z.number().nonnegative(),
  // individualPlaytimeFormatted: string;

  averageMatchDuration: z.number().nonnegative(),
  // averageMatchDurationFormatted: string;

  averageGoals: z.number().nonnegative(),

  averageBallOutsPerMatch: z.number().nonnegative().nullable(),
  averagePositionChangesPerMatch: z.number().nonnegative().nullable(),
  averageOwnGoalsPerMatch: z.number().nonnegative().nullable(),

  // floorMatchCount: Record<number, number>;
  // colorWinCount: Record<string, number>;

  // floors: number[];
  // colors: string[];
});
export type AggregateStats = z.infer<typeof AggregateStats>;

export const SessionStats = AggregateStats.extend({
  session: z.string(),
  humanSession: z.string(),
});
export type SessionStats = z.infer<typeof SessionStats>;

export const DayStats = AggregateStats.extend({
  date: z.number().nullable(),
  humanDate: z.string(),
});
export type DayStats = z.infer<typeof DayStats>;

export const WeekStats = AggregateStats.extend({
  week: z.number().nullable(),
  humanWeek: z.string(),
});
export type WeekStats = z.infer<typeof WeekStats>;

export const MonthStats = AggregateStats.extend({
  month: z.number().nullable(),
  humanMonth: z.string(),
});
export type MonthStats = z.infer<typeof MonthStats>;

export const SeasonStats = AggregateStats.extend({
  season: z.string(),
});
export type SeasonStats = z.infer<typeof SeasonStats>;

export const GeneralStats = AggregateStats.extend({
  totalPlaytimeExtrapolated: z.number().nonnegative(),
  // totalPlaytimeExtrapolatedFormatted: string;

  totalIndividualPlaytimeExtrapolated: z.number().nonnegative(),
  // totalIndividualPlaytimeExtrapolatedFormatted: string;
});
export type GeneralStats = z.infer<typeof GeneralStats>;

export const PlayerStats = z.object({
  // name: string;
  id: z.string(),

  playtime: z.number().nonnegative(),
  // playtimeFormatted: string;
  matches: z.number().int().nonnegative(),

  averageMatchDuration: z.number().nonnegative(),
  // averageMatchDurationFormatted: string;

  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  winRatio: z.number().nonnegative(),

  goalsFor: z.number().int().nonnegative(),
  goalsAgainst: z.number().int().nonnegative(),

  goalDifference: z.number().int(),
  goalRatio: z.number(),

  ownGoals: z.number().int().nonnegative(),

  goalTypesCount: z.record(GoalType, z.number().int().nonnegative()),

  currentWinStreak: z.number().int().nonnegative(),
  longestWinStreak: z.number().int().nonnegative(),

  currentLossStreak: z.number().int().nonnegative(),
  longestLossStreak: z.number().int().nonnegative(),

  lastMatchDate: z.number().nonnegative().nullable(),

  matchesInDay: z.number().int().nonnegative(),
  mostMatchesInDay: z.number().int().nonnegative(),

  matchesInSeason: z.number().int().nonnegative(),
  mostMatchesInSeason: z.number().int().nonnegative(),

  matchesWonAgainst: z.record(z.string(), z.number().int().nonnegative()),
  matchesLostAgainst: z.record(z.string(), z.number().int().nonnegative()),

  matchesWonAgainstSingles: z.record(
    z.string(),
    z.number().int().nonnegative(),
  ),
  matchesLostAgainstSingles: z.record(
    z.string(),
    z.number().int().nonnegative(),
  ),

  matchesWonAgainstDoubles: z.record(
    z.string(),
    z.number().int().nonnegative(),
  ),
  matchesLostAgainstDoubles: z.record(
    z.string(),
    z.number().int().nonnegative(),
  ),

  _matchesWithDuration: z.number().int().nonnegative(),
  _matchesWithTimeline: z.number().int().nonnegative(),
  _matchesWithGoalTypes: z.number().int().nonnegative(),
});
export type PlayerStats = z.infer<typeof PlayerStats>;

export const EloRating = z.object({
  matchId: z.string(),

  rating: z.number(),
  ratingChange: z.number(),
});
export type EloRating = z.infer<typeof EloRating>;

export const Glicko2Rating = z.object({
  matchId: z.string(),

  rating: z.number(),
  ratingChange: z.number(),

  rd: z.number(),
  rdChange: z.number(),

  volatility: z.number(),
  volatilityChange: z.number(),
});
export type Glicko2Rating = z.infer<typeof Glicko2Rating>;

export const EloRatings = z.object({
  playerElos: z.record(z.string(), EloRating),
  teamElos: z.record(z.string(), EloRating),
  teamIndividualElos: z.record(z.string(), EloRating),
  hybridElos: z.record(z.string(), EloRating),
});
export type EloRatings = z.infer<typeof EloRatings>;

export const Glicko2Ratings = z.object({
  playerGlicko2: z.record(z.string(), Glicko2Rating),
  teamGlicko2: z.record(z.string(), Glicko2Rating),
  teamIndividualGlicko2: z.record(z.string(), Glicko2Rating),
  hybridGlicko2: z.record(z.string(), Glicko2Rating),
});
export type Glicko2Ratings = z.infer<typeof Glicko2Ratings>;

export const StatsFrame = z.object({
  // match: Match;
  // season: Season;

  matchStats: MatchStats,
  sessionStats: SessionStats,
  dayStats: DayStats,
  weekStats: WeekStats,
  monthStats: MonthStats,
  seasonStats: SeasonStats,
  generalStats: GeneralStats,

  playerStats: z.record(z.string(), PlayerStats),

  eloRatings: EloRatings,
  glicko2Ratings: Glicko2Ratings,
});
export type StatsFrame = z.infer<typeof StatsFrame>;
