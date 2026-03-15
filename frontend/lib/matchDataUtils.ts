import {
  defaultDayStats,
  defaultEloRating,
  defaultEloRatings,
  defaultGlicko2Rating,
  defaultGlicko2Ratings,
  defaultMatchDataFrame,
  defaultMonthStats,
  defaultPlayerStats,
  defaultSeasonStats,
  defaultSessionStats,
  defaultWeekStats,
} from '#flib/defaultStats';
import { getSeason } from '#flib/seasons';
import {
  calculateElos,
  calculateGlicko2Ratings,
  formatDate,
  formatDuration,
  formatMatchLabel,
  formatMonth,
  formatSession,
  formatWeek,
  getBallOutEvents,
  getGoalEvents,
  getMonth,
  getOwnGoalEvents,
  getPlayersFromMatch,
  getPlayersFromTeam,
  getPositionChangeEvents,
  getSession,
  getTotalGoalsWithDuration,
  getTotalMatches,
  getTotalMatchesWithDuration,
  getTotalMatchesWithTimeline,
  getWeek,
} from '#flib/sheetUtils';
import { addNullable } from '#flib/utils';
import type {
  AggregateFrame,
  AggregateStats,
  DayStats,
  EloRatingDelta,
  EloRatingDeltas,
  EloRatings,
  GeneralStats,
  Glicko2RatingDelta,
  Glicko2RatingDeltas,
  Glicko2Ratings,
  MatchData,
  MatchDataDeltaFrame,
  MatchDataFrame,
  MatchStats,
  MonthStats,
  PlayerStats,
  SeasonStats,
  SessionStats,
  WeekStats,
} from '#frontend/types';
import { normalizeTeamName } from '#shared/matchUtils';
import type { Match } from '#shared/types/Sheets';

function computePlayerStatDeltas(
  endStats: Record<string, PlayerStats>,
  startStats: Record<string, PlayerStats>,
): Record<string, PlayerStats> {
  const result: Record<string, PlayerStats> = {};

  for (const [player, end] of Object.entries(endStats)) {
    const start = startStats[player] ?? defaultPlayerStats(player);

    const delta: PlayerStats = {
      name: end.name,

      playtime: end.playtime - start.playtime,
      playtimeFormatted: formatDuration(end.playtime - start.playtime),
      matches: end.matches - start.matches,

      averageMatchDuration:
        end.averageMatchDuration - start.averageMatchDuration,
      averageMatchDurationFormatted: formatDuration(
        end.averageMatchDuration - start.averageMatchDuration,
      ),

      wins: end.wins - start.wins,
      losses: end.losses - start.losses,
      winRatio: end.winRatio - start.winRatio,

      goalsFor: end.goalsFor - start.goalsFor,
      goalsAgainst: end.goalsAgainst - start.goalsAgainst,

      goalDifference: end.goalDifference - start.goalDifference,
      goalRatio: end.goalRatio - start.goalRatio,

      ownGoals: end.ownGoals - start.ownGoals,

      currentWinStreak: end.currentWinStreak - start.currentWinStreak,
      longestWinStreak: end.longestWinStreak - start.longestWinStreak,

      currentLossStreak: end.currentLossStreak - start.currentLossStreak,
      longestLossStreak: end.longestLossStreak - start.longestLossStreak,

      lastMatchDate: end.lastMatchDate,

      matchesInDay: end.matchesInDay - start.matchesInDay,
      mostMatchesInDay: end.mostMatchesInDay - start.mostMatchesInDay,

      matchesInSeason: end.matchesInSeason - start.matchesInSeason,
      mostMatchesInSeason: end.mostMatchesInSeason - start.mostMatchesInSeason,

      matchesWonAgainst: Object.fromEntries(
        Object.entries(end.matchesWonAgainst).map(([opponent, count]) => [
          opponent,
          count - (start.matchesWonAgainst[opponent] ?? 0),
        ]),
      ),
      matchesLostAgainst: Object.fromEntries(
        Object.entries(end.matchesLostAgainst).map(([opponent, count]) => [
          opponent,
          count - (start.matchesLostAgainst[opponent] ?? 0),
        ]),
      ),

      matchesWonAgainstSingles: Object.fromEntries(
        Object.entries(end.matchesWonAgainstSingles).map(
          ([opponent, count]) => [
            opponent,
            count - (start.matchesWonAgainstSingles[opponent] ?? 0),
          ],
        ),
      ),
      matchesLostAgainstSingles: Object.fromEntries(
        Object.entries(end.matchesLostAgainstSingles).map(
          ([opponent, count]) => [
            opponent,
            count - (start.matchesLostAgainstSingles[opponent] ?? 0),
          ],
        ),
      ),

      matchesWonAgainstDoubles: Object.fromEntries(
        Object.entries(end.matchesWonAgainstDoubles).map(
          ([opponent, count]) => [
            opponent,
            count - (start.matchesWonAgainstDoubles[opponent] ?? 0),
          ],
        ),
      ),
      matchesLostAgainstDoubles: Object.fromEntries(
        Object.entries(end.matchesLostAgainstDoubles).map(
          ([opponent, count]) => [
            opponent,
            count - (start.matchesLostAgainstDoubles[opponent] ?? 0),
          ],
        ),
      ),

      _matchesWithDuration:
        end._matchesWithDuration - start._matchesWithDuration,
    };

    result[player] = delta;
  }

  return result;
}

function computeEloDeltas(
  endRatings: EloRatings,
  startRatings: EloRatings,
): EloRatingDeltas {
  const result = structuredClone(defaultEloRatings) as EloRatingDeltas;

  for (const [category, ratings] of Object.entries(result) as [
    keyof EloRatings,
    Record<string, EloRatingDelta>,
  ][]) {
    const startCategory = startRatings[category];

    for (const [name, end] of Object.entries(endRatings[category])) {
      const start = startCategory[name] ?? defaultEloRating(end.id);

      ratings[name] = {
        id: end.id,
        rating: end.rating,
        ratingChange: end.rating - start.rating,
      };
    }
  }

  return result;
}

function computeGlicko2Deltas(
  endRatings: Glicko2Ratings,
  startRatings: Glicko2Ratings,
): Glicko2RatingDeltas {
  const result = structuredClone(defaultGlicko2Ratings) as Glicko2RatingDeltas;

  for (const [category, ratings] of Object.entries(result) as [
    keyof Glicko2Ratings,
    Record<string, Glicko2RatingDelta>,
  ][]) {
    const startCategory = startRatings[category];

    for (const [name, end] of Object.entries(endRatings[category])) {
      const start = startCategory[name] ?? defaultGlicko2Rating(end.id);

      ratings[name] = {
        id: end.id,
        rating: end.rating,
        ratingChange: end.rating - start.rating,

        rd: end.rd,
        rdChange: end.rd - start.rd,

        volatility: end.volatility,
        volatilityChange: end.volatility - start.volatility,
      };
    }
  }

  return result;
}

export function createDeltaFrame(
  end: MatchDataFrame,
  start: MatchDataFrame | null,
  respectSeasonChange = true,
): MatchDataDeltaFrame {
  const startFrame = start ?? defaultMatchDataFrame;

  const seasonChange =
    respectSeasonChange && end.season.number !== startFrame.season.number;

  return {
    match: end.match,
    season: end.season,
    matchStats: end.matchStats,
    sessionStats: end.sessionStats,
    dayStats: end.dayStats,
    weekStats: end.weekStats,
    monthStats: end.monthStats,
    seasonStats: end.seasonStats,
    generalStats: end.generalStats,
    playerStats: computePlayerStatDeltas(
      end.playerStats,
      startFrame.playerStats,
    ),
    eloRatings: computeEloDeltas(
      end.eloRatings,
      seasonChange ? defaultEloRatings : startFrame.eloRatings,
    ),
    glicko2Ratings: computeGlicko2Deltas(
      end.glicko2Ratings,
      seasonChange ? defaultGlicko2Ratings : startFrame.glicko2Ratings,
    ),

    previousFrame: start,
  };
}

export function calculateMatchStats(
  match: Match,
  previousData: MatchDataFrame,
): MatchStats {
  const goalEvents = getGoalEvents(match)?.sort((a, b) => a.time - b.time);

  let averageTimeBetweenGoals = null;
  let longestTimeBetweenGoals = null;
  let shortestTimeBetweenGoals = null;

  if (goalEvents && goalEvents.length >= 2) {
    const timeDiffs = goalEvents.map((event, i) => {
      const prev =
        i !== 0 ? goalEvents.at(i - 1)?.time : match.replayMetadata?.startedAt;

      return event.time - prev!;
    });

    averageTimeBetweenGoals =
      timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    longestTimeBetweenGoals = Math.max(...timeDiffs);
    shortestTimeBetweenGoals = Math.min(...timeDiffs);
  }

  return {
    label: formatMatchLabel(match),

    goalsPerMinute: match.duration
      ? (match.score1 + match.score2) / (match.duration / 60)
      : 0,

    ballOutCount: getBallOutEvents(match)?.length ?? null,
    positionChangeCount: getPositionChangeEvents(match)?.length ?? null,
    ownGoalCount: getOwnGoalEvents(match)?.length ?? null,

    averageTimeBetweenGoals,
    averageTimeBetweenGoalsFormatted: formatDuration(averageTimeBetweenGoals),

    longestTimeBetweenGoals,
    longestTimeBetweenGoalsFormatted: formatDuration(longestTimeBetweenGoals),

    shortestTimeBetweenGoals,
    shortestTimeBetweenGoalsFormatted: formatDuration(shortestTimeBetweenGoals),

    _matchCounter: getTotalMatches(match, previousData.matchStats),
    _goalsWithDuration: getTotalGoalsWithDuration(
      match,
      previousData.matchStats,
    ),
    _matchesWithDuration: getTotalMatchesWithDuration(
      match,
      previousData.matchStats,
    ),
    _matchesWithTimeline: getTotalMatchesWithTimeline(
      match,
      previousData.matchStats,
    ),
  };
}

export function calculateAggregateStats(
  match: Match,
  matchStats: MatchStats,
  _previousData: MatchDataFrame,
  previousStats: AggregateStats,
): AggregateStats {
  // Base stats helpers
  const _matchCounter = getTotalMatches(match, previousStats);
  const _goalsWithDuration = getTotalGoalsWithDuration(match, previousStats);
  const _matchesWithDuration = getTotalMatchesWithDuration(
    match,
    previousStats,
  );
  const _matchesWithTimeline = getTotalMatchesWithTimeline(
    match,
    previousStats,
  );

  // Base stats
  const ballOutCount = addNullable(
    previousStats.ballOutCount,
    matchStats.ballOutCount,
  );
  const positionChangeCount = addNullable(
    previousStats.positionChangeCount,
    matchStats.positionChangeCount,
  );
  const ownGoalCount = addNullable(
    previousStats.ownGoalCount,
    matchStats.ownGoalCount,
  );

  // Aggregate stats
  const playtime = addNullable(previousStats.playtime, match.duration, 0);
  const individualPlaytime =
    previousStats.individualPlaytime +
    (match.duration ?? 0) * getPlayersFromMatch(match).length;

  // Base stats
  const averageTimeBetweenGoals = playtime
    ? playtime / _goalsWithDuration
    : null;
  const longestTimeBetweenGoals =
    matchStats.longestTimeBetweenGoals && previousStats.longestTimeBetweenGoals
      ? Math.max(
          previousStats.longestTimeBetweenGoals,
          matchStats.longestTimeBetweenGoals,
        )
      : (previousStats.longestTimeBetweenGoals ??
        matchStats.longestTimeBetweenGoals);
  const shortestTimeBetweenGoals =
    matchStats.shortestTimeBetweenGoals &&
    previousStats.shortestTimeBetweenGoals
      ? Math.min(
          previousStats.shortestTimeBetweenGoals,
          matchStats.shortestTimeBetweenGoals,
        )
      : (previousStats.shortestTimeBetweenGoals ??
        matchStats.shortestTimeBetweenGoals);
  const goalsPerMinute = playtime ? _goalsWithDuration / (playtime / 60) : 0;

  // Aggregate stats
  const players = Array.from(
    new Set([...previousStats.players, ...getPlayersFromMatch(match)]),
  ).sort();
  const matches = _matchCounter;
  const goals = previousStats.goals + match.score1 + match.score2;
  const averageMatchDuration = playtime / (_matchesWithDuration || 1);
  const averageGoals = matches ? goals / matches : 0;

  const averageBallOutsPerMatch = ballOutCount
    ? ballOutCount / _matchesWithTimeline
    : null;
  const averagePositionChangesPerMatch = positionChangeCount
    ? positionChangeCount / _matchesWithTimeline
    : null;
  const averageOwnGoalsPerMatch = ownGoalCount
    ? ownGoalCount / _matchesWithTimeline
    : null;

  const floorMatchCount = structuredClone(previousStats.floorMatchCount);
  if (match.floor !== null) {
    floorMatchCount[match.floor] = (floorMatchCount[match.floor] ?? 0) + 1;
  }

  const colorWinCount = structuredClone(previousStats.colorWinCount);
  if (match.winningColor && match.winningColor !== 'unknown') {
    colorWinCount[match.winningColor] =
      (colorWinCount[match.winningColor] ?? 0) + 1;
  }

  const floors = Array.from(
    new Set([...previousStats.floors, match.floor].filter((f) => f !== null)),
  );

  const colors = Array.from(
    new Set(
      [...previousStats.colors, match.winningColor].filter(
        (c) => c !== null && c !== 'unknown',
      ),
    ),
  );

  return {
    ballOutCount,
    positionChangeCount,
    ownGoalCount,

    averageTimeBetweenGoals,
    averageTimeBetweenGoalsFormatted: formatDuration(averageTimeBetweenGoals),

    longestTimeBetweenGoals,
    longestTimeBetweenGoalsFormatted: formatDuration(longestTimeBetweenGoals),

    shortestTimeBetweenGoals,
    shortestTimeBetweenGoalsFormatted: formatDuration(shortestTimeBetweenGoals),

    goalsPerMinute,

    players,

    matches,
    goals,

    playtime,
    playtimeFormatted: formatDuration(playtime),

    individualPlaytime,
    individualPlaytimeFormatted: formatDuration(individualPlaytime),

    averageMatchDuration,
    averageMatchDurationFormatted: formatDuration(averageMatchDuration),
    averageGoals,

    averageBallOutsPerMatch,
    averagePositionChangesPerMatch,
    averageOwnGoalsPerMatch,

    floorMatchCount,
    colorWinCount,

    floors,
    colors,

    _matchCounter,
    _goalsWithDuration,
    _matchesWithDuration,
    _matchesWithTimeline,
  };
}

export function calculateSessionStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): SessionStats {
  const session = getSession(match, previousData);

  const previousStats =
    previousData.sessionStats.session === session
      ? previousData.sessionStats
      : defaultSessionStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  return {
    session,
    humanSession: formatSession(session),

    ...aggregateStats,
  };
}

export function calculateDayStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): DayStats {
  const previousStats =
    match.date === previousData.match.date
      ? previousData.dayStats
      : defaultDayStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  return {
    date: match.date,
    humanDate: formatDate(match.date),

    ...aggregateStats,
  };
}

export function calculateWeekStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): WeekStats {
  const week = getWeek(match);

  const previousStats =
    week === previousData.weekStats.week
      ? previousData.weekStats
      : defaultWeekStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  return {
    week,
    humanWeek: formatWeek(week),

    ...aggregateStats,
  };
}

export function calculateMonthStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): MonthStats {
  const month = getMonth(match);

  const previousStats =
    month === previousData.monthStats.month
      ? previousData.monthStats
      : defaultMonthStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  return {
    month,
    humanMonth: formatMonth(month),

    ...aggregateStats,
  };
}

export function calculateSeasonStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): SeasonStats {
  const season = getSeason(match.date);

  const previousStats =
    season.number === previousData.seasonStats.season.number
      ? previousData.seasonStats
      : defaultSeasonStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  return {
    season,

    ...aggregateStats,
  };
}

export function calculateGeneralStats(
  match: Match,
  matchStats: MatchStats,
  previousData: MatchDataFrame,
): GeneralStats {
  const previousStats = previousData.generalStats;

  const aggregateStats = calculateAggregateStats(
    match,
    matchStats,
    previousData,
    previousStats,
  );

  const totalPlaytimeExtrapolated =
    aggregateStats.playtime +
    aggregateStats.averageMatchDuration *
      (aggregateStats.matches - previousStats._matchesWithDuration);

  const totalIndividualPlaytimeExtrapolated =
    aggregateStats.individualPlaytime +
    aggregateStats.averageMatchDuration *
      (aggregateStats.matches - previousStats._matchesWithDuration) *
      2.5;

  const matchTeams =
    getPlayersFromMatch(match).length === 4
      ? [normalizeTeamName(match.team1), normalizeTeamName(match.team2)]
      : [];

  const teams = Array.from(
    new Set<string>([...previousStats.teams, ...matchTeams]),
  ).sort();

  return {
    ...aggregateStats,

    totalPlaytimeExtrapolated,
    totalPlaytimeExtrapolatedFormatted: formatDuration(
      totalPlaytimeExtrapolated,
    ),

    totalIndividualPlaytimeExtrapolated,
    totalIndividualPlaytimeExtrapolatedFormatted: formatDuration(
      totalIndividualPlaytimeExtrapolated,
    ),

    teams,
  };
}

export function calculatePlayerStats(
  match: Match,
  _matchStats: MatchStats,
  _previousData: MatchDataFrame,
  previousStats: PlayerStats,
): PlayerStats {
  const name = previousStats.name;
  const teams = [match.team1, match.team2] as const;

  const [, opponentTeamName] = match.team1.includes(name)
    ? teams
    : teams.toReversed();

  const _matchesWithDuration =
    previousStats._matchesWithDuration + (match.duration ? 1 : 0);

  const playerTeamGoals = match.team1.includes(name)
    ? match.score1
    : match.score2;
  const playerOponentGoals = match.team1.includes(name)
    ? match.score2
    : match.score1;

  const hasWon = playerTeamGoals > playerOponentGoals;

  const playtime = previousStats.playtime + (match.duration ?? 0);
  const matches = previousStats.matches + 1;

  const averageMatchDuration = playtime / (_matchesWithDuration || 1);

  const wins = previousStats.wins + (hasWon ? 1 : 0);
  const losses = previousStats.losses + (hasWon ? 0 : 1);
  const winRatio = losses ? wins / losses : 0;

  const goalsFor = previousStats.goalsFor + playerTeamGoals;
  const goalsAgainst = previousStats.goalsAgainst + playerOponentGoals;

  const goalDifference =
    previousStats.goalDifference + (playerTeamGoals - playerOponentGoals);
  const goalRatio = goalsAgainst ? goalsFor / goalsAgainst : goalsFor;

  const ownGoals =
    previousStats.ownGoals + (getOwnGoalEvents(match, name)?.length ?? 0);

  const currentWinStreak = hasWon ? previousStats.currentWinStreak + 1 : 0;
  const longestWinStreak = Math.max(
    currentWinStreak,
    previousStats.longestWinStreak,
  );

  const currentLossStreak =
    hasWon === false ? previousStats.currentLossStreak + 1 : 0;
  const longestLossStreak = Math.max(
    currentLossStreak,
    previousStats.longestLossStreak,
  );

  const lastMatchDate = match.date;

  const matchesInDay =
    previousStats.lastMatchDate === match.date && match.date
      ? previousStats.matchesInDay + 1
      : 1;
  const mostMatchesInDay = Math.max(
    matchesInDay,
    previousStats.mostMatchesInDay,
  );

  const matchesInSeason =
    getSeason(match.date).number ===
    getSeason(previousStats.lastMatchDate ?? 0).number
      ? previousStats.matchesInSeason + 1
      : 1;
  const mostMatchesInSeason = Math.max(
    matchesInSeason,
    previousStats.mostMatchesInSeason,
  );

  const matchesWonAgainst = { ...previousStats.matchesWonAgainst };
  const matchesLostAgainst = { ...previousStats.matchesLostAgainst };

  const matchesWonAgainstSingles = {
    ...previousStats.matchesWonAgainstSingles,
  };
  const matchesLostAgainstSingles = {
    ...previousStats.matchesLostAgainstSingles,
  };

  const matchesWonAgainstDoubles = {
    ...previousStats.matchesWonAgainstDoubles,
  };
  const matchesLostAgainstDoubles = {
    ...previousStats.matchesLostAgainstDoubles,
  };

  for (const opponent of getPlayersFromTeam(opponentTeamName)) {
    if (hasWon) {
      matchesWonAgainst[opponent] = (matchesWonAgainst[opponent] ?? 0) + 1;
    } else {
      matchesLostAgainst[opponent] = (matchesLostAgainst[opponent] ?? 0) + 1;
    }

    const isSingles = getPlayersFromTeam(opponentTeamName).length === 1;

    if (isSingles) {
      if (hasWon) {
        matchesWonAgainstSingles[opponent] =
          (matchesWonAgainstSingles[opponent] ?? 0) + 1;
      } else {
        matchesLostAgainstSingles[opponent] =
          (matchesLostAgainstSingles[opponent] ?? 0) + 1;
      }
    } else {
      if (hasWon) {
        matchesWonAgainstDoubles[opponent] =
          (matchesWonAgainstDoubles[opponent] ?? 0) + 1;
      } else {
        matchesLostAgainstDoubles[opponent] =
          (matchesLostAgainstDoubles[opponent] ?? 0) + 1;
      }
    }
  }

  return {
    name,

    playtime,
    playtimeFormatted: formatDuration(playtime),
    matches,

    averageMatchDuration,
    averageMatchDurationFormatted: formatDuration(averageMatchDuration),

    wins,
    losses,
    winRatio,

    goalsFor,
    goalsAgainst,

    goalDifference,
    goalRatio,

    ownGoals,

    currentWinStreak,
    longestWinStreak,

    currentLossStreak,
    longestLossStreak,

    lastMatchDate,

    matchesInDay,
    mostMatchesInDay,

    matchesInSeason,
    mostMatchesInSeason,

    matchesWonAgainst,
    matchesLostAgainst,

    matchesWonAgainstSingles,
    matchesLostAgainstSingles,

    matchesWonAgainstDoubles,
    matchesLostAgainstDoubles,

    _matchesWithDuration,
  };
}

export function calculatePlayersStats(
  match: Match,
  _matchStats: MatchStats,
  previousData: MatchDataFrame,
): Record<string, PlayerStats> {
  const updatedPlayerStats = { ...previousData.playerStats };

  for (const player of getPlayersFromMatch(match)) {
    const playerStats =
      previousData.playerStats[player] ?? defaultPlayerStats(player);

    updatedPlayerStats[player] = calculatePlayerStats(
      match,
      _matchStats,
      previousData,
      playerStats,
    );
  }

  return updatedPlayerStats;
}

function calculateEloRatings(
  match: Match,
  previousData: MatchDataFrame,
): EloRatings {
  return {
    playerElos: calculateElos(match, previousData, 'player'),
    teamElos: calculateElos(match, previousData, 'team'),
    teamIndividualElos: calculateElos(match, previousData, 'team-individual'),
    hybridElos: calculateElos(match, previousData, 'hybrid'),
  };
}

function calculateGlicko2Stats(
  match: Match,
  previousData: MatchDataFrame,
): Glicko2Ratings {
  return {
    playerGlicko2: calculateGlicko2Ratings(match, previousData, 'player'),
    teamGlicko2: calculateGlicko2Ratings(match, previousData, 'team'),
    teamIndividualGlicko2: calculateGlicko2Ratings(
      match,
      previousData,
      'team-individual',
    ),
    hybridGlicko2: calculateGlicko2Ratings(match, previousData, 'hybrid'),
  };
}

export function calculateDataFrame(
  match: Match,
  previousMatchData: MatchDataFrame | null,
): MatchDataFrame {
  const prev = previousMatchData ?? defaultMatchDataFrame;

  const season = getSeason(match.date);

  const matchStats = calculateMatchStats(match, prev);
  const sessionStats = calculateSessionStats(match, matchStats, prev);
  const dayStats = calculateDayStats(match, matchStats, prev);
  const weekStats = calculateWeekStats(match, matchStats, prev);
  const monthStats = calculateMonthStats(match, matchStats, prev);
  const seasonStats = calculateSeasonStats(match, matchStats, prev);
  const generalStats = calculateGeneralStats(match, matchStats, prev);

  const playerStats = calculatePlayersStats(match, matchStats, prev);

  return {
    match,
    season,

    matchStats,
    sessionStats,
    dayStats,
    weekStats,
    monthStats,
    seasonStats,
    generalStats,

    playerStats,

    eloRatings: calculateEloRatings(match, prev),
    glicko2Ratings: calculateGlicko2Stats(match, prev),

    previousFrame: prev,
  };
}

export function calculateMatchData(matches: Match[]): MatchData {
  const frames: MatchDataFrame[] = [];

  const sessionStatsMap: Map<string, AggregateFrame> = new Map();
  const dayStatsMap: Map<number, AggregateFrame> = new Map();
  const weekStatsMap: Map<number, AggregateFrame> = new Map();
  const monthStatsMap: Map<number, AggregateFrame> = new Map();
  const seasonStatsMap: Map<number, AggregateFrame> = new Map();

  let previousFrame: MatchDataFrame | null = null;
  let previousSessionFrame: MatchDataFrame | null = null;
  let previousDayFrame: MatchDataFrame | null = null;
  let previousWeekFrame: MatchDataFrame | null = null;
  let previousMonthFrame: MatchDataFrame | null = null;
  let previousSeasonFrame: MatchDataFrame | null = null;

  for (const match of matches) {
    const currentFrame = calculateDataFrame(match, previousFrame);

    frames.push(currentFrame);

    const session = currentFrame.sessionStats.session;
    if (previousFrame && previousFrame.sessionStats.session !== session) {
      previousSessionFrame = previousFrame;
    }

    const aggregateSessionFrame = sessionStatsMap.get(session);

    if (aggregateSessionFrame) {
      aggregateSessionFrame.frame = currentFrame;
    } else {
      sessionStatsMap.set(session, {
        previousFrame: previousSessionFrame ?? defaultMatchDataFrame,
        frame: currentFrame,
      });
    }

    const day = currentFrame.dayStats.date;
    if (day !== null) {
      if (previousFrame && previousFrame.dayStats.date !== day) {
        previousDayFrame = previousFrame;
      }

      const aggregateDayFrame = dayStatsMap.get(day);

      if (aggregateDayFrame) {
        aggregateDayFrame.frame = currentFrame;
      } else {
        dayStatsMap.set(day, {
          previousFrame: previousDayFrame ?? defaultMatchDataFrame,
          frame: currentFrame,
        });
      }
    }

    const week = currentFrame.weekStats.week;
    if (week !== null) {
      if (previousFrame && previousFrame.weekStats.week !== week) {
        previousWeekFrame = previousFrame;
      }

      const aggregateWeekFrame = weekStatsMap.get(week);

      if (aggregateWeekFrame) {
        aggregateWeekFrame.frame = currentFrame;
      } else {
        weekStatsMap.set(week, {
          previousFrame: previousWeekFrame ?? defaultMatchDataFrame,
          frame: currentFrame,
        });
      }
    }

    const month = currentFrame.monthStats.month;
    if (month !== null) {
      if (previousFrame && previousFrame.monthStats.month !== month) {
        previousMonthFrame = previousFrame;
      }

      const aggregateMonthFrame = monthStatsMap.get(month);

      if (aggregateMonthFrame) {
        aggregateMonthFrame.frame = currentFrame;
      } else {
        monthStatsMap.set(month, {
          previousFrame: previousMonthFrame ?? defaultMatchDataFrame,
          frame: currentFrame,
        });
      }
    }

    const seasonNumber = currentFrame.season.number;

    if (previousFrame && previousFrame.season.number !== seasonNumber) {
      previousSeasonFrame = previousFrame;
    }

    const aggregateSeasonFrame = seasonStatsMap.get(seasonNumber);

    if (aggregateSeasonFrame) {
      aggregateSeasonFrame.frame = currentFrame;
    } else {
      seasonStatsMap.set(seasonNumber, {
        previousFrame: previousSeasonFrame ?? defaultMatchDataFrame,
        frame: currentFrame,
      });
    }

    previousFrame = currentFrame;
  }

  return {
    frames,
    latest: frames.at(-1) ?? defaultMatchDataFrame,

    sessionStats: Object.fromEntries(sessionStatsMap.entries()),
    dayStats: Object.fromEntries(dayStatsMap.entries()),
    weekStats: Object.fromEntries(weekStatsMap.entries()),
    monthStats: Object.fromEntries(monthStatsMap.entries()),
    seasonStats: Object.fromEntries(seasonStatsMap.entries()),
  };
}
