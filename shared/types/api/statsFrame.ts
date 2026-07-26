import type { GoalType } from '#shared/types/api/matchEvent';

export interface BaseStats {
  label: string;

  averageTimeBetweenGoals: number | null;
  averageTimeBetweenGoalsFormatted: string;

  longestTimeBetweenGoals: number | null;
  longestTimeBetweenGoalsFormatted: string;

  shortestTimeBetweenGoals: number | null;
  shortestTimeBetweenGoalsFormatted: string;

  goalsPerMinute: number | null;

  ballOutCount: number | null;
  positionChangeCount: number | null;
  ownGoalCount: number | null;

  goalTypesCount: Record<GoalType, number>;

  _matchCounter: number;
  _goalsWithDuration: number;
  _matchesWithDuration: number;
  _matchesWithTimeline: number;
  _matchesWithGoalTypes: number;
}

export interface MatchStats extends BaseStats {}

export interface AggregateStats extends BaseStats {
  // players:   string[];
  // teams:   string[];

  matches: number;
  goals: number;

  playtime: number;
  // playtimeFormatted: string;

  individualPlaytime: number;
  // individualPlaytimeFormatted: string;

  averageMatchDuration: number;
  // averageMatchDurationFormatted: string;

  averageGoals: number;

  averageBallOutsPerMatch: number | null;
  averagePositionChangesPerMatch: number | null;
  averageOwnGoalsPerMatch: number | null;

  // floorMatchCount: Record<number, number>;
  // colorWinCount: Record<string, number>;

  // floors: number[];
  // colors: string[];
}

export interface SessionStats extends AggregateStats {
  session: string;
  humanSession: string;
}

export interface DayStats extends AggregateStats {
  date: number | null;
  humanDate: string;
}

export interface WeekStats extends AggregateStats {
  week: number | null;
  humanWeek: string;
}

export interface MonthStats extends AggregateStats {
  month: number | null;
  humanMonth: string;
}

export interface SeasonStats extends AggregateStats {
  season: string;
}

export interface GeneralStats extends AggregateStats {
  totalPlaytimeExtrapolated: number;
  // totalPlaytimeExtrapolatedFormatted: string;

  totalIndividualPlaytimeExtrapolated: number;
  // totalIndividualPlaytimeExtrapolatedFormatted: string;
}

export interface PlayerStats {
  // name: string;
  id: string;

  playtime: number;
  // playtimeFormatted: string;
  matches: number;

  averageMatchDuration: number;
  // averageMatchDurationFormatted: string;

  wins: number;
  losses: number;
  winRatio: number;

  goalsFor: number;
  goalsAgainst: number;

  goalDifference: number;
  goalRatio: number;

  ownGoals: number;

  currentWinStreak: number;
  longestWinStreak: number;

  currentLossStreak: number;
  longestLossStreak: number;

  lastMatchDate: number | null;

  matchesInDay: number;
  mostMatchesInDay: number;

  matchesInSeason: number;
  mostMatchesInSeason: number;

  matchesWonAgainst: Record<string, number>;
  matchesLostAgainst: Record<string, number>;

  matchesWonAgainstSingles: Record<string, number>;
  matchesLostAgainstSingles: Record<string, number>;

  matchesWonAgainstDoubles: Record<string, number>;
  matchesLostAgainstDoubles: Record<string, number>;

  _matchesWithDuration: number;
}

export interface PlayerStats {
  name: string;

  playtime: number;
  playtimeFormatted: string;
  matches: number;

  averageMatchDuration: number;
  averageMatchDurationFormatted: string;

  wins: number;
  losses: number;
  winRatio: number;

  goalsFor: number;
  goalsAgainst: number;

  goalDifference: number;
  goalRatio: number;

  // ownGoals: number;
  ballOutCount: number | null;
  positionChangeCount: number | null;
  ownGoalCount: number | null;

  goalTypesCount: Record<GoalType, number>;

  currentWinStreak: number;
  longestWinStreak: number;

  currentLossStreak: number;
  longestLossStreak: number;

  lastMatchDate: number | null;

  matchesInDay: number;
  mostMatchesInDay: number;

  matchesInSeason: number;
  mostMatchesInSeason: number;

  matchesWonAgainst: Record<string, number>;
  matchesLostAgainst: Record<string, number>;

  matchesWonAgainstSingles: Record<string, number>;
  matchesLostAgainstSingles: Record<string, number>;

  matchesWonAgainstDoubles: Record<string, number>;
  matchesLostAgainstDoubles: Record<string, number>;

  _matchesWithDuration: number;
  _matchesWithTimeline: number;
  _matchesWithGoalTypes: number;
}

export interface EloRating {
  id: number;

  rating: number;
}

export interface EloRatingDelta extends EloRating {
  ratingChange: number;
}

export interface Glicko2Rating {
  id: number;

  rating: number;

  rd: number;

  volatility: number;
}

export interface Glicko2RatingDelta extends Glicko2Rating {
  ratingChange: number;
  rdChange: number;
  volatilityChange: number;
}

export interface EloRatingsBase<T extends EloRating> {
  playerElos: Record<string, T>;
  teamElos: Record<string, T>;
  teamIndividualElos: Record<string, T>;
  hybridElos: Record<string, T>;
}

export interface EloRatings extends EloRatingsBase<EloRating> {}

export interface EloRatingDeltas extends EloRatingsBase<EloRatingDelta> {}

export interface Glicko2RatingsBase<T extends Glicko2Rating> {
  playerGlicko2: Record<string, T>;
  teamGlicko2: Record<string, T>;
  teamIndividualGlicko2: Record<string, T>;
  hybridGlicko2: Record<string, T>;
}

export interface Glicko2Ratings extends Glicko2RatingsBase<Glicko2Rating> {}

export interface Glicko2RatingDeltas
  extends Glicko2RatingsBase<Glicko2RatingDelta> {}

export interface StatsFrame {
  // match: Match;
  // season: Season;

  matchStats: MatchStats;
  sessionStats: SessionStats;
  dayStats: DayStats;
  weekStats: WeekStats;
  monthStats: MonthStats;
  seasonStats: SeasonStats;
  generalStats: GeneralStats;

  playerStats: Record<string, PlayerStats>;

  eloRatings: EloRatings;
  glicko2Ratings: Glicko2Ratings;

  previousFrame: StatsFrame | null;
}
