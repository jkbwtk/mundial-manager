import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import type { Match } from '#shared/types/Sheets';
import { quickSwitch } from '#shared/utils';

dayjs.extend(duration);

export const DEFAULT_ELO = 1500;

export const DEFAULT_GLICKO2_RATING = 1500;
export const DEFAULT_GLICKO2_RD = 350;
export const DEFAULT_GLICKO2_VOLATILITY = 0.06;
const GLICKO2_TAU = 0.5;
const GLICKO2_EPSILON = 0.000001;

export interface Glicko2Rating {
  rating: number;
  rd: number;
  volatility: number;
}

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
  previousElos: Record<string, number>,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, number> {
  const elos = structuredClone(previousElos);

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
          (sum, player) => sum + (previousElos[player] ?? DEFAULT_ELO),
          0,
        ) / players.length
      );
    }

    return previousElos[team] ?? DEFAULT_ELO;
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

    const playerElo = previousElos[player] ?? DEFAULT_ELO;

    elos[player] =
      playerElo +
      calculateEloDiff(
        playerTeam.elo,
        opponentTeam.elo,
        playerTeam.score,
        opponentTeam.score,
      );
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

export function calculateGlicko2Diff(
  playerRating: Glicko2Rating,
  opponentRating: Glicko2Rating,
  playerScore: number,
  opponentScore: number,
): Glicko2Rating {
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

  const defaultRating: Glicko2Rating = {
    rating: DEFAULT_GLICKO2_RATING,
    rd: DEFAULT_GLICKO2_RD,
    volatility: DEFAULT_GLICKO2_VOLATILITY,
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

  const getTeamRating = (team: string): Glicko2Rating => {
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

    ratings[player] = calculateGlicko2Diff(
      playerRating,
      opponentTeam.rating,
      playerTeam.score,
      opponentTeam.score,
    );
  }

  return ratings;
}

export function applyGlicko2RatingDecay(
  rating: Glicko2Rating,
  timePeriods: number,
): Glicko2Rating {
  const newRd = Math.min(
    Math.sqrt(
      rating.rd * rating.rd +
        timePeriods * rating.volatility * rating.volatility,
    ),
    DEFAULT_GLICKO2_RD,
  );

  return {
    rating: rating.rating,
    rd: newRd,
    volatility: rating.volatility,
  };
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

export function compareEloVsGlicko2(
  match: Match,
  previousElos: Record<string, number>,
  previousGlicko2: Record<string, Glicko2Rating>,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid' = 'player',
): {
  elo: Record<string, number>;
  glicko2: Record<string, Glicko2Rating>;
  comparison: Record<
    string,
    {
      eloDiff: number;
      glicko2Diff: number;
      confidence: number;
    }
  >;
} {
  const newElos = calculateElos(match, previousElos, mode);
  const newGlicko2 = calculateGlicko2Ratings(match, previousGlicko2, mode);

  const comparison: Record<
    string,
    {
      eloDiff: number;
      glicko2Diff: number;
      confidence: number;
    }
  > = {};

  const players = getPlayersFromMatch(match);

  for (const player of players) {
    const oldElo = previousElos[player] ?? DEFAULT_ELO;
    const newElo = newElos[player] ?? DEFAULT_ELO;

    const oldGlicko2 = previousGlicko2[player] ?? {
      rating: DEFAULT_GLICKO2_RATING,
      rd: DEFAULT_GLICKO2_RD,
      volatility: DEFAULT_GLICKO2_VOLATILITY,
    };
    const newGlicko2Rating = newGlicko2[player] ?? oldGlicko2;

    comparison[player] = {
      eloDiff: newElo - oldElo,
      glicko2Diff: newGlicko2Rating.rating - oldGlicko2.rating,
      confidence: getGlicko2Confidence(newGlicko2Rating),
    };
  }

  return {
    elo: newElos,
    glicko2: newGlicko2,
    comparison,
  };
}
