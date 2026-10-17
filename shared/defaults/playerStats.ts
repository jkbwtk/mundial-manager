import type { PlayerStats } from '#shared/types/stats/playerStats';

export const defaultPlayerStats: PlayerStats = {
  matches: 0,
  spectatedMatches: 0,

  wins: 0,
  losses: 0,
  draws: 0,
  cancelledMatches: 0,

  goalsFor: 0,
  goalsAgainst: 0,

  goals: 0,
  ownGoals: 0,
  goalTypesCount: {},
  stylePoints: 0,
  mostStylePointsInMatch: null,

  playtime: 0,
  participationTime: 0,

  currentWinStreak: 0,
  longestWinStreak: 0,
  currentLossStreak: 0,
  longestLossStreak: 0,

  mostMatchesInDay: 0,

  _matchesWithDuration: 0,
  _matchesWithTimeline: 0,
  _lastDay: null,
  _dayMatches: 0,
};
