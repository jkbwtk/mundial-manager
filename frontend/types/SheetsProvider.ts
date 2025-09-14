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

export interface MatchStats {
  id: number;

  goalsPerMinute: number;

  playerElos: Record<string, number>;
  teamElos: Record<string, number>;
  hybridElos: Record<string, number>;
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
