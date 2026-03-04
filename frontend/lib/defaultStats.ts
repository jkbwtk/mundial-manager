import { defaultSeason } from '#flib/seasons';
import {
  DEFAULT_ELO,
  DEFAULT_GLICKO2_RATING,
  DEFAULT_GLICKO2_RD,
  DEFAULT_GLICKO2_VOLATILITY,
  formatDuration,
} from '#flib/sheetUtils';
import type {
  AggregateFrame,
  AggregateStats,
  BaseStats,
  DayStats,
  EloRating,
  EloRatings,
  GeneralStats,
  Glicko2Rating,
  Glicko2Ratings,
  MatchDataFrame,
  MatchStats,
  MonthStats,
  PlayerStats,
  SeasonStats,
  SessionStats,
  WeekStats,
} from '#frontend/types';
import type { Match } from '#shared/types/Sheets';

export const defaultMatch: Match = {
  id: -1,
  team1: '',
  team2: '',
  score1: 0,
  score2: 0,
  duration: null,
  winningColor: '',
  date: null,
  floor: null,
  replayMetadata: null,

  hash: '',
};

export const defaultBaseStats: BaseStats = {
  ballOutCount: null,
  positionChangeCount: null,
  ownGoalCount: null,

  averageTimeBetweenGoals: null,
  averageTimeBetweenGoalsFormatted: formatDuration(null),

  longestTimeBetweenGoals: null,
  longestTimeBetweenGoalsFormatted: formatDuration(null),

  shortestTimeBetweenGoals: null,
  shortestTimeBetweenGoalsFormatted: formatDuration(null),

  goalsPerMinute: null,

  _matchCounter: 0,
  _goalsWithDuration: 0,
  _matchesWithDuration: 0,
  _matchesWithTimeline: 0,
};

export const defaultMatchStats: MatchStats = {
  ...structuredClone(defaultBaseStats),

  label: '',
};

export const defaultAggregateStats: AggregateStats = {
  ...structuredClone(defaultBaseStats),

  players: [],

  matches: 0,
  goals: 0,

  playtime: 0,
  playtimeFormatted: formatDuration(0),

  individualPlaytime: 0,
  individualPlaytimeFormatted: formatDuration(0),

  averageMatchDuration: 0,
  averageMatchDurationFormatted: formatDuration(0),

  averageGoals: 0,

  averageBallOutsPerMatch: null,
  averagePositionChangesPerMatch: null,
  averageOwnGoalsPerMatch: null,

  floorMatchCount: {},
  colorWinCount: {},
};

export const defaultSessionStats: SessionStats = {
  ...structuredClone(defaultAggregateStats),

  session: '0#0',
  humanSession: '',
};

export const defaultDayStats: DayStats = {
  ...structuredClone(defaultAggregateStats),

  date: 0,
  humanDate: '',
};

export const defaultWeekStats: WeekStats = {
  ...structuredClone(defaultAggregateStats),

  week: 0,
  humanWeek: '',
};

export const defaultMonthStats: MonthStats = {
  ...structuredClone(defaultAggregateStats),

  month: 0,
  humanMonth: '',
};

export const defaultSeasonStats: SeasonStats = {
  ...structuredClone(defaultAggregateStats),

  season: structuredClone(defaultSeason),
};

export const defaultGeneralStats: GeneralStats = {
  ...structuredClone(defaultAggregateStats),

  totalPlaytimeExtrapolated: 0,
  totalPlaytimeExtrapolatedFormatted: formatDuration(0),

  totalIndividualPlaytimeExtrapolated: 0,
  totalIndividualPlaytimeExtrapolatedFormatted: formatDuration(0),

  teams: [],
};

export function defaultEloRating(matchId: number): EloRating {
  return {
    id: matchId,
    rating: DEFAULT_ELO,
  };
}

export const defaultEloRatings: EloRatings = {
  playerElos: {},
  hybridElos: {},
  teamIndividualElos: {},
  teamElos: {},
};

export function defaultGlicko2Rating(matchId: number): Glicko2Rating {
  return {
    id: matchId,
    rating: DEFAULT_GLICKO2_RATING,

    rd: DEFAULT_GLICKO2_RD,

    volatility: DEFAULT_GLICKO2_VOLATILITY,
  };
}

export const defaultGlicko2Ratings: Glicko2Ratings = {
  playerGlicko2: {},
  hybridGlicko2: {},
  teamIndividualGlicko2: {},
  teamGlicko2: {},
};

export const defaultMatchDataFrame: MatchDataFrame = {
  match: defaultMatch,
  season: defaultSeason,

  matchStats: defaultMatchStats,
  sessionStats: defaultSessionStats,
  dayStats: defaultDayStats,
  weekStats: defaultWeekStats,
  monthStats: defaultMonthStats,
  seasonStats: defaultSeasonStats,
  generalStats: defaultGeneralStats,

  playerStats: {},

  eloRatings: defaultEloRatings,
  glicko2Ratings: defaultGlicko2Ratings,

  previousFrame: null,
};

export function defaultPlayerStats(name: string): PlayerStats {
  return {
    name,

    playtime: 0,
    playtimeFormatted: formatDuration(0),
    matches: 0,

    averageMatchDuration: 0,
    averageMatchDurationFormatted: formatDuration(0),

    wins: 0,
    losses: 0,
    winRatio: 0,

    goalsFor: 0,
    goalsAgainst: 0,

    goalDifference: 0,
    goalRatio: 0,

    ownGoals: 0,

    currentWinStreak: 0,
    longestWinStreak: 0,

    currentLossStreak: 0,
    longestLossStreak: 0,

    lastMatchDate: null,

    matchesInDay: 0,
    mostMatchesInDay: 0,

    matchesInSeason: 0,
    mostMatchesInSeason: 0,

    matchesWonAgainst: {},
    matchesLostAgainst: {},

    matchesWonAgainstSingles: {},
    matchesLostAgainstSingles: {},

    matchesWonAgainstDoubles: {},
    matchesLostAgainstDoubles: {},

    _matchesWithDuration: 0,
  };
}

export const defaultAggregateFrame: AggregateFrame = {
  previousFrame: defaultMatchDataFrame,
  frame: defaultMatchDataFrame,
};
