import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { isServer } from 'solid-js/web';
import type {
  DayStats,
  EloRating,
  EloRatings,
  GeneralStats,
  Glicko2Rating,
  Glicko2Ratings,
  MatchStats,
  PlayerStats,
} from '#frontend/types';
import { getMatchHash } from '#shared/matchUtils';
import type { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import type {
  Match,
  MatchCreate,
  MatchEvent,
  MatchEventGoal,
} from '#shared/types/Sheets';
import { quickSwitch } from '#shared/utils';

dayjs.extend(duration);

export const DEFAULT_ELO = 1500;

export const DEFAULT_GLICKO2_RATING = 1500;
export const DEFAULT_GLICKO2_RD = 350;
export const DEFAULT_GLICKO2_VOLATILITY = 0.06;
const GLICKO2_TAU = 0.5;
const GLICKO2_EPSILON = 0.000001;

export function formatDuration(seconds: number): string {
  if (seconds < 3600) {
    return dayjs.duration(seconds, 'seconds').format('mm:ss');
  }

  if (seconds < 86400) {
    return dayjs.duration(seconds, 'seconds').format('HH:mm:ss');
  }

  const durationObj = dayjs.duration(seconds, 'seconds');
  const hours = durationObj.asHours();

  return `${Math.floor(hours)}:${durationObj.format('mm:ss')}`;
}

export function formatDate(timestamp: number): string {
  return dayjs.unix(timestamp).format('YYYY-MM-DD');
}

export function getPlayersFromTeam(team: string): string[] {
  return team.split(/\s+/g).sort();
}

export function getPlayersFromMatch(match: Match): string[] {
  return [
    ...getPlayersFromTeam(match.team1),
    ...getPlayersFromTeam(match.team2),
  ];
}

function getKFactor(rating: number): number {
  if (rating < 2100) {
    return 32;
  }
  if (rating < 2400) {
    return 24;
  }
  return 16;
}

function getScoreMultiplier(scoreDiff: number): number {
  return quickSwitch<number>(scoreDiff, {
    0: 1.0,
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.3,
    5: 1.4,
    6: 1.5,
    7: 1.6,
    8: 1.7,
    9: 1.8,
    10: 2.0,
    default: 1,
  });
}

export function calculateEloDiff(
  playerElo: number,
  opponentElo: number,
  playerScore: number,
  opponentScore: number,
): number {
  let playerFactor = getKFactor(playerElo);

  const expectedPlayer = 1.0 / (1.0 + 10 ** ((opponentElo - playerElo) / 400));

  let playerActual = 0;
  const scoreDiff = Math.abs(playerScore - opponentScore);

  if (playerScore > opponentScore) {
    playerActual = 1.0;
    playerFactor *= getScoreMultiplier(scoreDiff);
  } else if (playerScore === opponentScore) {
    playerActual = 0.5;
  }

  return playerFactor * (playerActual - expectedPlayer);
}

export function calculateElos(
  match: Match,
  previousElos: Record<string, EloRating>,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, EloRating> {
  const elos = structuredClone(previousElos);

  for (const elo of Object.values(elos)) {
    elo.ratingChange = 0;
  }

  if (mode === 'player') {
    if (getPlayersFromMatch(match).length !== 2) {
      return elos;
    }
  }

  if (mode === 'team' || mode === 'team-individual') {
    if (getPlayersFromMatch(match).length === 2) {
      return elos;
    }
  }

  const playersToCalculate =
    mode === 'hybrid' || mode === 'team-individual'
      ? getPlayersFromMatch(match)
      : [match.team1, match.team2];

  const getTeamElo = (team: string): number => {
    if (mode === 'hybrid') {
      const players = getPlayersFromTeam(team);

      return (
        players.reduce(
          (sum, player) => sum + (previousElos[player]?.rating ?? DEFAULT_ELO),
          0,
        ) / players.length
      );
    }

    return previousElos[team]?.rating ?? DEFAULT_ELO;
  };

  for (const player of playersToCalculate) {
    const playerTeam = match.team1.includes(player)
      ? {
          elo: getTeamElo(match.team1),
          score: match.score1,
        }
      : {
          elo: getTeamElo(match.team2),
          score: match.score2,
        };

    const opponentTeam = match.team1.includes(player)
      ? {
          elo: getTeamElo(match.team2),
          score: match.score2,
        }
      : {
          elo: getTeamElo(match.team1),
          score: match.score1,
        };

    const playerElo: EloRating = previousElos[player] ?? {
      rating: DEFAULT_ELO,
      ratingChange: 0,
    };

    const ratingChange = calculateEloDiff(
      playerTeam.elo,
      opponentTeam.elo,
      playerTeam.score,
      opponentTeam.score,
    );

    elos[player] = {
      rating: playerElo.rating + ratingChange,
      ratingChange,
    };
  }

  return elos;
}

function scaleRatingToGlicko2(rating: number): number {
  return (rating - 1500) / 173.7178;
}

function scaleRatingFromGlicko2(rating: number): number {
  return rating * 173.7178 + 1500;
}

function scaleRDToGlicko2(rd: number): number {
  return rd / 173.7178;
}

function scaleRDFromGlicko2(rd: number): number {
  return rd * 173.7178;
}

function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * rd * rd) / (Math.PI * Math.PI));
}

function E(mu: number, muj: number, phij: number): number {
  return 1 / (1 + Math.exp(-g(phij) * (mu - muj)));
}

function f(
  x: number,
  delta: number,
  phi: number,
  v: number,
  a: number,
  tau: number,
): number {
  const ex = Math.exp(x);
  const phi2 = phi * phi;
  const tau2 = tau * tau;
  return (
    (ex * (delta * delta - phi2 - v - ex)) /
      (2 * (phi2 + v + ex) * (phi2 + v + ex)) -
    (x - a) / tau2
  );
}

type Glicko2RatingInternal = Pick<
  Glicko2Rating,
  'rating' | 'rd' | 'volatility'
>;

export function calculateGlicko2Diff(
  playerRating: Glicko2RatingInternal,
  opponentRating: Glicko2RatingInternal,
  playerScore: number,
  opponentScore: number,
): Glicko2RatingInternal {
  const mu = scaleRatingToGlicko2(playerRating.rating);
  const phi = scaleRDToGlicko2(playerRating.rd);
  const sigma = playerRating.volatility;

  const muj = scaleRatingToGlicko2(opponentRating.rating);
  const phij = scaleRDToGlicko2(opponentRating.rd);

  let s: number;
  if (playerScore > opponentScore) {
    s = 1;
  } else if (playerScore === opponentScore) {
    s = 0.5;
  } else {
    s = 0;
  }

  const gPhij = g(phij);
  const E_val = E(mu, muj, phij);
  const v = 1 / (gPhij * gPhij * E_val * (1 - E_val));

  const delta = v * gPhij * (s - E_val);

  const a = Math.log(sigma * sigma);
  let A = a;
  let B: number;

  const phi2 = phi * phi;
  const delta2 = delta * delta;

  if (delta2 > phi2 + v) {
    B = Math.log(delta2 - phi2 - v);
  } else {
    let k = 1;
    while (f(a - k * GLICKO2_TAU, delta, phi, v, a, GLICKO2_TAU) < 0) {
      k++;
    }
    B = a - k * GLICKO2_TAU;
  }

  let fA = f(A, delta, phi, v, a, GLICKO2_TAU);
  let fB = f(B, delta, phi, v, a, GLICKO2_TAU);

  while (Math.abs(B - A) > GLICKO2_EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C, delta, phi, v, a, GLICKO2_TAU);

    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }

    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);

  const phiStar = Math.sqrt(phi2 + newSigma * newSigma);

  const newPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const newMu = mu + newPhi * newPhi * gPhij * (s - E_val);

  return {
    rating: scaleRatingFromGlicko2(newMu),
    rd: scaleRDFromGlicko2(newPhi),
    volatility: newSigma,
  };
}

export function calculateGlicko2Ratings(
  match: Match,
  previousRatings: Record<string, Glicko2Rating>,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, Glicko2Rating> {
  const ratings = structuredClone(previousRatings);

  for (const rating of Object.values(ratings)) {
    rating.ratingChange = 0;
    rating.rdChange = 0;
    rating.volatilityChange = 0;
  }

  const defaultRating: Glicko2Rating = {
    rating: DEFAULT_GLICKO2_RATING,
    ratingChange: 0,

    rd: DEFAULT_GLICKO2_RD,
    rdChange: 0,

    volatility: DEFAULT_GLICKO2_VOLATILITY,
    volatilityChange: 0,
  };

  if (mode === 'player') {
    if (getPlayersFromMatch(match).length !== 2) {
      return ratings;
    }
  }

  if (mode === 'team' || mode === 'team-individual') {
    if (getPlayersFromMatch(match).length === 2) {
      return ratings;
    }
  }

  const playersToCalculate =
    mode === 'hybrid' || mode === 'team-individual'
      ? getPlayersFromMatch(match)
      : [match.team1, match.team2];

  const getTeamRating = (team: string): Glicko2RatingInternal => {
    if (mode === 'hybrid') {
      const players = getPlayersFromTeam(team);
      const teamRatings = players.map(
        (player) => previousRatings[player] ?? defaultRating,
      );

      const avgRating =
        teamRatings.reduce((sum, r) => sum + r.rating, 0) / teamRatings.length;
      const avgRd =
        teamRatings.reduce((sum, r) => sum + r.rd, 0) / teamRatings.length;
      const avgVolatility =
        teamRatings.reduce((sum, r) => sum + r.volatility, 0) /
        teamRatings.length;

      return {
        rating: avgRating,
        rd: avgRd,
        volatility: avgVolatility,
      };
    }

    return previousRatings[team] ?? defaultRating;
  };

  for (const player of playersToCalculate) {
    const playerTeam = match.team1.includes(player)
      ? {
          rating: getTeamRating(match.team1),
          score: match.score1,
        }
      : {
          rating: getTeamRating(match.team2),
          score: match.score2,
        };

    const opponentTeam = match.team1.includes(player)
      ? {
          rating: getTeamRating(match.team2),
          score: match.score2,
        }
      : {
          rating: getTeamRating(match.team1),
          score: match.score1,
        };

    const playerRating = previousRatings[player] ?? defaultRating;

    const updatedGlicko2Rating = calculateGlicko2Diff(
      playerRating,
      opponentTeam.rating,
      playerTeam.score,
      opponentTeam.score,
    );

    ratings[player] = {
      ...updatedGlicko2Rating,
      ratingChange: updatedGlicko2Rating.rating - playerRating.rating,
      rdChange: updatedGlicko2Rating.rd - playerRating.rd,
      volatilityChange:
        updatedGlicko2Rating.volatility - playerRating.volatility,
    };
  }

  return ratings;
}

export function getGlicko2Confidence(rating: Glicko2Rating): number {
  const maxRd = DEFAULT_GLICKO2_RD;
  const minRd = 30;

  const normalizedRd = Math.max(
    0,
    Math.min(1, (maxRd - rating.rd) / (maxRd - minRd)),
  );
  return normalizedRd * 100;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export function generateTeamColor(team: string): string {
  const hash = hashString(team);

  const hueBase = hash % 12;
  const hueOffsets = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const hue = (hueOffsets[hueBase]! + ((hash >> 4) % 25) + 90) % 360;

  const saturationOptions = [70, 85, 100];
  const lightnessOptions = [50, 60, 70, 80];

  const satIndex = (hash >> 8) % saturationOptions.length;
  const lightIndex = (hash >> 12) % lightnessOptions.length;

  const saturation = saturationOptions[satIndex]!;
  const lightness = lightnessOptions[lightIndex]!;

  return hslToHex(hue, saturation, lightness);
}

export function formatMatchLabel(match: Match): string {
  return `#${match.id}`;
}

const defaultGeneralStats: GeneralStats = {
  totalMatches: 0,
  totalGoals: 0,

  uniquePlayers: [],

  totalPlaytime: 0,
  totalPlaytimeFormatted: formatDuration(0),
  totalIndividualPlaytime: 0,
  totalIndividualPlaytimeFormatted: formatDuration(0),

  averageMatchDuration: 0,
  averageMatchDurationFormatted: formatDuration(0),
  averageGoals: 0,

  totalPlaytimeExtrapolated: 0,
  totalPlaytimeExtrapolatedFormatted: formatDuration(0),
  totalIndividualPlaytimeExtrapolated: 0,
  totalIndividualPlaytimeExtrapolatedFormatted: formatDuration(0),

  floorMatchCount: {},
  colorWinCount: {},
};

export const defaultMatchStats: MatchStats = {
  id: -1,
  label: '',

  goalsPerMinute: 0,

  generalStats: structuredClone(defaultGeneralStats),
  playerStats: {},

  eloRatings: {
    playerElos: {},
    teamElos: {},
    teamIndividualElos: {},
    hybridElos: {},
  },

  glicko2Ratings: {
    playerGlicko2: {},
    teamGlicko2: {},
    teamIndividualGlicko2: {},
    hybridGlicko2: {},
  },

  _matchCounter: 0,
  _matchesWithDuration: 0,
};

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

function getTotalMatches(_match: Match, previousStats: MatchStats) {
  return previousStats._matchCounter + 1;
}

function getTotalMatchesWithDuration(match: Match, previousStats: MatchStats) {
  return previousStats._matchesWithDuration + (match.duration ? 1 : 0);
}

function calculateGeneralStats(
  match: Match,
  previousStats: MatchStats,
): GeneralStats {
  const _matchesWithDuration = getTotalMatchesWithDuration(
    match,
    previousStats,
  );

  const totalMatches = getTotalMatches(match, previousStats);
  const totalGoals =
    previousStats.generalStats.totalGoals + match.score1 + match.score2;

  const uniquePlayers = Array.from(
    new Set([
      ...previousStats.generalStats.uniquePlayers,
      ...getPlayersFromMatch(match),
    ]),
  ).sort();

  const totalPlaytime =
    previousStats.generalStats.totalPlaytime + (match.duration ?? 0);
  const totalPlaytimeFormatted = formatDuration(totalPlaytime);
  const totalIndividualPlaytime =
    previousStats.generalStats.totalIndividualPlaytime +
    (match.duration ?? 0) * getPlayersFromMatch(match).length;
  const totalIndividualPlaytimeFormatted = formatDuration(
    totalIndividualPlaytime,
  );

  const averageMatchDuration = _matchesWithDuration
    ? totalPlaytime / _matchesWithDuration
    : 0;
  const averageMatchDurationFormatted = formatDuration(averageMatchDuration);
  const averageGoals = totalMatches ? totalGoals / totalMatches : 0;

  const totalPlaytimeExtrapolated =
    totalPlaytime +
    averageMatchDuration * (totalMatches - _matchesWithDuration);
  const totalPlaytimeExtrapolatedFormatted = formatDuration(
    totalPlaytimeExtrapolated,
  );
  const totalIndividualPlaytimeExtrapolated =
    totalIndividualPlaytime +
    averageMatchDuration *
      (totalMatches - _matchesWithDuration) *
      getPlayersFromMatch(match).length;
  const totalIndividualPlaytimeExtrapolatedFormatted = formatDuration(
    totalIndividualPlaytimeExtrapolated,
  );

  const floorMatchCount = structuredClone(
    previousStats.generalStats.floorMatchCount,
  );

  if (match.floor !== null) {
    floorMatchCount[match.floor] = (floorMatchCount[match.floor] ?? 0) + 1;
  }

  const colorWinCount = structuredClone(
    previousStats.generalStats.colorWinCount,
  );

  if (match.winningColor && match.winningColor !== 'unknown') {
    colorWinCount[match.winningColor] =
      (colorWinCount[match.winningColor] ?? 0) + 1;
  }

  return {
    totalMatches,
    totalGoals,

    uniquePlayers,

    totalPlaytime,
    totalPlaytimeFormatted,
    totalIndividualPlaytime,
    totalIndividualPlaytimeFormatted,

    averageMatchDuration,
    averageMatchDurationFormatted,
    averageGoals,

    totalPlaytimeExtrapolated,
    totalPlaytimeExtrapolatedFormatted,
    totalIndividualPlaytimeExtrapolated,
    totalIndividualPlaytimeExtrapolatedFormatted,

    floorMatchCount,
    colorWinCount,
  };
}

function getDefaultPlayerStats(player: string): PlayerStats {
  return {
    player,

    totalPlaytime: 0,
    totalPlaytimeFormatted: formatDuration(0),
    totalMatches: 0,

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

    _matchesWithDuration: 0,
  };
}

function calculatePlayerStats(
  match: Match,
  previousStats: MatchStats,
): Record<string, PlayerStats> {
  const updatedPlayerStats = structuredClone(previousStats.playerStats);

  for (const player of getPlayersFromMatch(match)) {
    const playerStats =
      previousStats.playerStats[player] ?? getDefaultPlayerStats(player);

    const _matchesWithDuration =
      playerStats._matchesWithDuration + (match.duration ? 1 : 0);
    const playerTeamGoals = match.team1.includes(player)
      ? match.score1
      : match.score2;
    const playerOponentGoals = match.team1.includes(player)
      ? match.score2
      : match.score1;

    const hasWon = playerTeamGoals === 10;

    playerStats.totalPlaytime += match.duration ?? 0;
    playerStats.totalPlaytimeFormatted = formatDuration(
      playerStats.totalPlaytime,
    );
    playerStats.totalMatches += 1;

    playerStats.averageMatchDuration =
      playerStats.totalPlaytime / (_matchesWithDuration || 1);
    playerStats.averageMatchDurationFormatted = formatDuration(
      playerStats.averageMatchDuration,
    );

    playerStats.wins += hasWon ? 1 : 0;
    playerStats.losses += hasWon ? 0 : 1;
    playerStats.winRatio = playerStats.losses
      ? playerStats.wins / playerStats.losses
      : 0;

    playerStats.goalsFor += playerTeamGoals;
    playerStats.goalsAgainst += playerOponentGoals;

    playerStats.goalDifference += playerTeamGoals - playerOponentGoals;
    playerStats.goalRatio =
      playerStats.goalsFor / (playerStats.goalsAgainst || 1);

    if (match.replayMetadata?.events) {
      const ownGoalsInMatch = match.replayMetadata.events.filter(
        (event) =>
          event.type === 'GOAL' &&
          event.player === player &&
          event.for !== event.by,
      );

      playerStats.ownGoals += ownGoalsInMatch.length;
    }

    if (hasWon) {
      playerStats.currentWinStreak += 1;
      playerStats.currentLossStreak = 0;
    } else {
      playerStats.currentWinStreak = 0;
      playerStats.currentLossStreak += 1;
    }

    playerStats.longestWinStreak = Math.max(
      playerStats.currentWinStreak,
      playerStats.longestWinStreak,
    );
    playerStats.longestLossStreak = Math.max(
      playerStats.currentLossStreak,
      playerStats.longestLossStreak,
    );

    playerStats._matchesWithDuration = _matchesWithDuration;

    updatedPlayerStats[player] = playerStats;
  }

  return updatedPlayerStats;
}

function calculateEloRatings(
  match: Match,
  previousStats: MatchStats,
): EloRatings {
  return {
    playerElos: calculateElos(
      match,
      previousStats.eloRatings.playerElos,
      'player',
    ),
    teamElos: calculateElos(match, previousStats.eloRatings.teamElos, 'team'),
    teamIndividualElos: calculateElos(
      match,
      previousStats.eloRatings.teamIndividualElos,
      'team-individual',
    ),
    hybridElos: calculateElos(
      match,
      previousStats.eloRatings.hybridElos,
      'hybrid',
    ),
  };
}

function calculateGlicko2Stats(
  match: Match,
  previousStats: MatchStats,
): Glicko2Ratings {
  return {
    playerGlicko2: calculateGlicko2Ratings(
      match,
      previousStats.glicko2Ratings.playerGlicko2,
      'player',
    ),
    teamGlicko2: calculateGlicko2Ratings(
      match,
      previousStats.glicko2Ratings.teamGlicko2,
      'team',
    ),
    teamIndividualGlicko2: calculateGlicko2Ratings(
      match,
      previousStats.glicko2Ratings.teamIndividualGlicko2,
      'team-individual',
    ),
    hybridGlicko2: calculateGlicko2Ratings(
      match,
      previousStats.glicko2Ratings.hybridGlicko2,
      'hybrid',
    ),
  };
}

export function calculateMatchStats(
  match: Match,
  previousStats: MatchStats = defaultMatchStats,
): MatchStats {
  return {
    id: match.id,
    label: formatMatchLabel(match),

    goalsPerMinute: match.duration
      ? (match.score1 + match.score2) / (match.duration / 60)
      : 0,

    generalStats: calculateGeneralStats(match, previousStats),
    playerStats: calculatePlayerStats(match, previousStats),

    eloRatings: calculateEloRatings(match, previousStats),
    glicko2Ratings: calculateGlicko2Stats(match, previousStats),

    _matchCounter: getTotalMatches(match, previousStats),
    _matchesWithDuration: getTotalMatchesWithDuration(match, previousStats),
  };
}

export function getLastGoalEvent(
  events: MatchEvent[] | null,
): MatchEventGoal | null {
  return events?.findLast((ev) => ev.type === 'GOAL') ?? null;
}

export function convertCalculatorFinishEventToMatch(
  event: CalculatorFinishEvent,
): MatchCreate {
  const lastGoal = getLastGoalEvent(event.events);
  const lastHistoryGoal = event.history?.at(-1);

  const winningColor = lastGoal?.for ?? lastHistoryGoal ?? 'unknown';

  const duration = lastGoal
    ? lastGoal.time - event.startedAt
    : Math.floor(Date.now() / 1000) - event.startedAt;

  return {
    team1: event.teams[0].join(' '),
    team2: event.teams[1].join(' '),

    date: event.startedAt,

    score1: event.scores[0],
    score2: event.scores[1],

    winningColor,
    duration,

    replayMetadata: event.events
      ? {
          startedAt: event.startedAt,
          events: event.events,
        }
      : null,
  };
}

export const COLOR_PAIRS: [string, string][] = [
  ['Niebieski', 'Czerwony2'],
  ['Zielony', 'Czerwony3'],
];

export function getTeamColors(match: MatchCreate | Match): [string, string] {
  for (const colors of COLOR_PAIRS) {
    if (colors.includes(match.winningColor)) {
      const team1Won = match.score1 > match.score2;
      const winningColorIsFirst = match.winningColor === colors[0];

      return team1Won === winningColorIsFirst
        ? [colors[0], colors[1]]
        : [colors[1], colors[0]];
    }
  }

  return ['unknown', 'unknown'];
}

export const FLOOR_MAP: Record<string, number> = {
  Czerwony2: 2,
  Czerwony3: 3,
};

export function getMatchFloor(match: MatchCreate): number | null {
  const colors = getTeamColors(match);

  for (const [color, floor] of Object.entries(FLOOR_MAP)) {
    if (colors.includes(color)) {
      return floor;
    }
  }

  return null;
}

function calculateEloDifferences(
  currentElos: Record<string, EloRating>,
  previousElos: Record<string, EloRating>,
): Record<string, EloRating> {
  const eloDifferences: Record<string, EloRating> = {};

  for (const [key, currentElo] of Object.entries(currentElos)) {
    const previousElo = previousElos[key];

    eloDifferences[key] = {
      rating: currentElo.rating,
      ratingChange: currentElo.rating - (previousElo?.rating ?? DEFAULT_ELO),
    };
  }

  return eloDifferences;
}

export function calculateEloRatingDifferences(
  previousElos: EloRatings,
  currentElos: EloRatings,
): EloRatings {
  return {
    playerElos: calculateEloDifferences(
      currentElos.playerElos,
      previousElos.playerElos,
    ),
    teamElos: calculateEloDifferences(
      currentElos.teamElos,
      previousElos.teamElos,
    ),
    teamIndividualElos: calculateEloDifferences(
      currentElos.teamIndividualElos,
      previousElos.teamIndividualElos,
    ),
    hybridElos: calculateEloDifferences(
      currentElos.hybridElos,
      previousElos.hybridElos,
    ),
  };
}

function calculateGlicko2Differences(
  currentRatings: Record<string, Glicko2Rating>,
  previousRatings: Record<string, Glicko2Rating>,
): Record<string, Glicko2Rating> {
  const ratingDifferences: Record<string, Glicko2Rating> = {};

  for (const [key, currentRating] of Object.entries(currentRatings)) {
    const previousRating = previousRatings[key];

    ratingDifferences[key] = {
      rating: currentRating.rating,
      ratingChange:
        currentRating.rating -
        (previousRating?.rating ?? DEFAULT_GLICKO2_RATING),

      rd: currentRating.rd,
      rdChange: currentRating.rd - (previousRating?.rd ?? DEFAULT_GLICKO2_RD),

      volatility: currentRating.volatility,
      volatilityChange:
        currentRating.volatility -
        (previousRating?.volatility ?? DEFAULT_GLICKO2_VOLATILITY),
    };
  }

  return ratingDifferences;
}

export function calculateGlicko2RatingDifferences(
  previousRatings: Glicko2Ratings,
  currentRatings: Glicko2Ratings,
): Glicko2Ratings {
  return {
    playerGlicko2: calculateGlicko2Differences(
      currentRatings.playerGlicko2,
      previousRatings.playerGlicko2,
    ),
    teamGlicko2: calculateGlicko2Differences(
      currentRatings.teamGlicko2,
      previousRatings.teamGlicko2,
    ),
    teamIndividualGlicko2: calculateGlicko2Differences(
      currentRatings.teamIndividualGlicko2,
      previousRatings.teamIndividualGlicko2,
    ),
    hybridGlicko2: calculateGlicko2Differences(
      currentRatings.hybridGlicko2,
      previousRatings.hybridGlicko2,
    ),
  };
}

export const defaultDayStats: DayStats = {
  date: 0,
  humanDate: '',

  players: [],

  matches: 0,
  goals: 0,
  playtime: 0,
  playtimeFormatted: '',
  individualPlaytime: 0,
  individualPlaytimeFormatted: '',

  averageMatchDuration: 0,
  averageMatchDurationFormatted: '',
  averageGoals: 0,

  goalsPerMinute: 0,

  eloRatings: {
    playerElos: {},
    teamElos: {},
    teamIndividualElos: {},
    hybridElos: {},
  },

  glicko2Ratings: {
    playerGlicko2: {},
    teamGlicko2: {},
    teamIndividualGlicko2: {},
    hybridGlicko2: {},
  },

  _matchesWithDuration: 0,
  _goalsWithDuration: 0,
};

export function calculateDayStats(
  matches: Match[],
  lastMatchStats: MatchStats,
  previousStats: DayStats = defaultDayStats,
): DayStats {
  const updatedStats: DayStats = structuredClone(defaultDayStats);

  const players: Set<string> = new Set();

  for (const match of matches) {
    const matchPlayers = getPlayersFromMatch(match);

    for (const player of matchPlayers) {
      players.add(player);
    }

    updatedStats.goals += match.score1 + match.score2;
    updatedStats.playtime += match.duration ?? 0;
    updatedStats.individualPlaytime +=
      (match.duration ?? 0) * matchPlayers.length;

    updatedStats._matchesWithDuration += match.duration ? 1 : 0;
    updatedStats._goalsWithDuration += match.duration
      ? match.score1 + match.score2
      : 0;
  }

  updatedStats.date = matches.at(0)?.date ?? 0;
  updatedStats.humanDate = formatDate(updatedStats.date);

  updatedStats.players = Array.from(players).sort();

  updatedStats.matches = matches.length;

  updatedStats.playtimeFormatted = formatDuration(updatedStats.playtime);
  updatedStats.individualPlaytimeFormatted = formatDuration(
    updatedStats.individualPlaytime,
  );

  updatedStats.averageMatchDuration =
    updatedStats.playtime / (updatedStats._matchesWithDuration || 1);
  updatedStats.averageMatchDurationFormatted = formatDuration(
    updatedStats.averageMatchDuration,
  );

  updatedStats.averageGoals = updatedStats.goals / (updatedStats.matches || 1);

  updatedStats.goalsPerMinute = updatedStats.playtime
    ? updatedStats._goalsWithDuration / (updatedStats.playtime / 60)
    : 0;

  updatedStats.eloRatings = calculateEloRatingDifferences(
    previousStats.eloRatings,
    lastMatchStats.eloRatings,
  );

  updatedStats.glicko2Ratings = calculateGlicko2RatingDifferences(
    previousStats.glicko2Ratings,
    lastMatchStats.glicko2Ratings,
  );

  return updatedStats;
}

export function getScoreAfterEvent(
  match: Match,
  event: MatchEvent,
): [number, number] {
  const colors = getTeamColors(match);
  const scores: [number, number] = [0, 0];

  for (const ev of match.replayMetadata?.events ?? []) {
    if (ev.time > event.time) {
      break;
    }

    if (ev.type === 'GOAL') {
      if (ev.for === colors[0]) {
        scores[0] += 1;
      } else {
        scores[1] += 1;
      }
    }
  }

  return scores;
}

export function cacheMatches(matches: Match[]) {
  if (isServer) {
    return;
  }

  localStorage.setItem('matchesCache', JSON.stringify(matches));
}

export function loadCachedMatches(): Match[] | null {
  if (isServer) {
    return null;
  }

  const cached = localStorage.getItem('matchesCache');

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as Match[];

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

export function saveCreatedMatches(matches: Record<string, MatchCreate>) {
  if (isServer) {
    return;
  }

  localStorage.setItem(
    'createdMatches',
    JSON.stringify(Object.values(matches)),
  );
}

export function loadCreatedMatches(): Record<string, MatchCreate> | null {
  if (isServer) {
    return null;
  }

  const saved = localStorage.getItem('createdMatches');

  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, MatchCreate>;

      if (Array.isArray(parsed)) {
        return Object.fromEntries(parsed.map((m) => [getMatchHash(m), m]));
      }
    } catch {
      return null;
    }
  }

  return null;
}
