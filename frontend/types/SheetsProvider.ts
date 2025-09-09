export interface GeneralStats {
  totalMatches: number;
  totalGoals: number;

  uniquePlayers: string[];

  totalPlaytime: number;
  totalIndividualPlaytime: number;

  averageMatchDuration: number;

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
