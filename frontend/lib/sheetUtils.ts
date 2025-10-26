import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import type {
  EloRating,
  EloRatings,
  GeneralStats,
  Glicko2Rating,
  Glicko2Ratings,
  MatchStats,
  PlayerStats,
} from '#frontend/types';
import type { Match } from '#shared/types/Sheets';
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

export function getTeamColor(team: string): string {
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

  const averageMatchDuration = totalMatches ? totalPlaytime / totalMatches : 0;
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

    playerStats.wins += playerTeamGoals === 10 ? 1 : 0;
    playerStats.losses += playerTeamGoals !== 10 ? 1 : 0;
    playerStats.winRatio = playerStats.losses
      ? playerStats.wins / playerStats.losses
      : 0;

    playerStats.goalsFor += playerTeamGoals;
    playerStats.goalsAgainst += playerOponentGoals;

    playerStats.goalDifference += playerTeamGoals - playerOponentGoals;
    playerStats.goalRatio =
      playerStats.goalsFor / (playerStats.goalsAgainst || 1);

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
