export interface GeneralStats {
  totalMatches: number;
  totalGoals: number;

  uniquePlayers: string[];

  totalPlaytime: number;
  totalIndividualPlaytime: number;

  averageMatchDuration: number;
  averageGoals: number;

  totalPlaytimeExtrapolated: number;
  totalIndividualPlaytimeExtrapolated: number;
}
export interface PlayerStats {
  player: string;

  totalPlaytime: number;
  totalMatches: number;

  averageMatchDuration: number;

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
}

export interface DayStats {
  date: number;
  humanDate: string;

  matches: number;
  goals: number;
  playtime: number;

  averageMatchDuration: number;
  averageGoals: number;

  goalsPerMinute: number;

  _matchesWithDuration: number;
  _goalsWithDuration: number;
}
