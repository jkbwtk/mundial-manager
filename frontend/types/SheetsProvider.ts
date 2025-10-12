export interface GeneralStats {
  totalMatches: number;
  totalGoals: number;

  uniquePlayers: string[];

  totalPlaytime: number;
  totalPlaytimeFormatted: string;
  totalIndividualPlaytime: number;
  totalIndividualPlaytimeFormatted: string;

  averageMatchDuration: number;
  averageMatchDurationFormatted: string;
  averageGoals: number;

  totalPlaytimeExtrapolated: number;
  totalPlaytimeExtrapolatedFormatted: string;
  totalIndividualPlaytimeExtrapolated: number;
  totalIndividualPlaytimeExtrapolatedFormatted: string;
}

export interface Glicko2Rating {
  rating: number;
  ratingChange: number;

  rd: number;
  rdChange: number;

  volatility: number;
  volatilityChange: number;
}

export interface PlayerStats {
  player: string;

  totalPlaytime: number;
  totalPlaytimeFormatted: string;
  totalMatches: number;

  averageMatchDuration: number;
  averageMatchDurationFormatted: string;

  wins: number;
  losses: number;
  winRatio: number;

  goalsFor: number;
  goalsAgainst: number;

  goalDifference: number;
  goalRatio: number;

  _matchesWithDuration: number;
}

export interface EloRating {
  rating: number;
  ratingChange: number;
}

export interface EloRatings {
  playerElos: Record<string, EloRating>;
  teamElos: Record<string, EloRating>;
  teamIndividualElos: Record<string, EloRating>;
  hybridElos: Record<string, EloRating>;
}

export interface Glicko2Ratings {
  playerGlicko2: Record<string, Glicko2Rating>;
  teamGlicko2: Record<string, Glicko2Rating>;
  teamIndividualGlicko2: Record<string, Glicko2Rating>;
  hybridGlicko2: Record<string, Glicko2Rating>;
}

export interface MatchStats {
  id: number;
  label: string;

  goalsPerMinute: number;

  generalStats: GeneralStats;

  playerStats: Record<string, PlayerStats>;

  eloRatings: EloRatings;
  glicko2Ratings: Glicko2Ratings;

  _matchCounter: number;
  _matchesWithDuration: number;
}

export interface DayStats {
  date: number;
  humanDate: string;

  players: string[];

  matches: number;
  goals: number;
  playtime: number;
  playtimeFormatted: string;

  averageMatchDuration: number;
  averageMatchDurationFormatted: string;
  averageGoals: number;

  goalsPerMinute: number;

  _matchesWithDuration: number;
  _goalsWithDuration: number;
}
