import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { isServer } from 'solid-js/web';
import { defaultSessionStats } from '#flib/defaultStats';
import { getSeason } from '#flib/seasons';
import type {
  BaseStats,
  EloRating,
  Glicko2Rating,
  MatchDataFrame,
  Season,
} from '#frontend/types';
import {
  getMatchHash,
  getPauseDuration,
  getTeamColors,
  hasBeenCancelled,
  normalizeTeamName,
} from '#shared/matchUtils';
import { formatDate } from '#shared/timeUtils';
import type { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import type {
  Match,
  MatchCreate,
  MatchEvent,
  MatchEventGoal,
} from '#shared/types/Sheets';
import { quickRangeSwitch, quickSwitch } from '#shared/utils';

dayjs.extend(duration);
dayjs.extend(weekOfYear);

const GLICKO2_TAU = 0.5;
const GLICKO2_EPSILON = 0.000001;

function decodeSession(
  session = defaultSessionStats.session,
): [number, number] {
  const parsed = session.split('#').map((v) => Number.parseInt(v, 10));

  if (parsed.length === 2) return parsed as [number, number];

  return [0, 0];
}

function encodeSession(date: number, index: number): string {
  return `${date}#${index}`;
}

export function getSession(
  match: Match,
  previousData: MatchDataFrame | null,
): string {
  if (
    match.date === null ||
    match.replayMetadata?.startedAt === undefined ||
    typeof match.duration !== 'number'
  ) {
    return defaultSessionStats.session;
  }

  const prevSession =
    previousData?.sessionStats.session ?? defaultSessionStats.session;
  const [prevDate, prevIndex] = decodeSession(prevSession);

  const sameDay = prevDate === match.date;
  const timeDelta = dayjs
    .unix(match.replayMetadata.startedAt)
    .diff(
      dayjs.unix(
        (previousData?.match.replayMetadata?.startedAt ?? 0) +
          (previousData?.match.duration ?? 0),
      ),
      'minutes',
    );

  const sessionThreshold = 15; //minutes

  if (sameDay) {
    if (timeDelta > sessionThreshold) {
      return encodeSession(prevDate, prevIndex + 1);
    }

    return prevSession;
  }

  return encodeSession(match.date, 1);
}

export function formatSession(session: string): string {
  const [date, index] = decodeSession(session);

  return `${formatDate(date)}#${index}`;
}

export function getWeek(match: Match): number | null {
  if (match.date === null) {
    return null;
  }

  const date = dayjs.unix(match.date);
  const year = date.year();
  const week = date.week();

  return year * 100 + week;
}

export function formatWeek(week: number | null): string {
  if (week === null) {
    return '-----W--';
  }

  const year = Math.floor(week / 100);
  const weekNum = week % 100;

  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

export function getMonth(match: Match): number | null {
  if (match.date === null) {
    return null;
  }

  const date = dayjs.unix(match.date);
  const year = date.year();
  const month = date.month() + 1;

  return year * 100 + month;
}

export function formatMonth(month: number | null): string {
  if (month === null) {
    return '-----M--';
  }

  const year = Math.floor(month / 100);
  const monthNum = month % 100;

  return `${year}-M${monthNum.toString().padStart(2, '0')}`;
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

function getKFactor(season: Season, rating: number): number {
  return quickRangeSwitch<number>(rating, season.config.eloKFactorRanges);
}

function getScoreMultiplier(season: Season, scoreDiff: number): number {
  return quickSwitch<number>(scoreDiff, season.config.eloScoreMultipliers);
}

export function calculateEloDiff(
  season: Season,
  playerElo: number,
  opponentElo: number,
  playerScore: number,
  opponentScore: number,
): number {
  let playerFactor = getKFactor(season, playerElo);

  const expectedPlayer = 1.0 / (1.0 + 10 ** ((opponentElo - playerElo) / 400));

  let playerActual = 0;
  const scoreDiff = Math.abs(playerScore - opponentScore);

  if (playerScore > opponentScore) {
    playerActual = 1.0;
    playerFactor *= getScoreMultiplier(season, scoreDiff);
  } else if (playerScore === opponentScore) {
    playerActual = 0.5;
  }

  return playerFactor * (playerActual - expectedPlayer);
}

export function calculateElos(
  match: Match,
  previousData: MatchDataFrame,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, EloRating> {
  const season = getSeason(match.date);
  const previousSeason = getSeason(previousData.match.date);

  const previousElos =
    season.number === previousSeason.number
      ? quickSwitch<Record<string, EloRating>, typeof mode>(mode, {
          player: previousData.eloRatings.playerElos,
          team: previousData.eloRatings.teamElos,
          'team-individual': previousData.eloRatings.teamIndividualElos,
          hybrid: previousData.eloRatings.hybridElos,
          default: {},
        })
      : {};

  const elos = { ...previousElos };

  if (hasBeenCancelled(match.replayMetadata?.events)) {
    return previousElos;
  }

  if (mode === 'player') {
    if (getPlayersFromMatch(match).length !== 2) {
      return previousElos;
    }
  }

  if (mode === 'team' || mode === 'team-individual') {
    if (getPlayersFromMatch(match).length === 2) {
      return previousElos;
    }
  }

  const defaultRating: EloRating = {
    id: match.id,
    rating: season.config.defaultEloRating,
  };

  const playersToCalculate =
    mode === 'hybrid' || mode === 'team-individual'
      ? getPlayersFromMatch(match)
      : [match.team1, match.team2];

  const getPreviousRating = (team: string): EloRating =>
    previousElos[team] ?? defaultRating;

  const getTeamElo = (team: string): number => {
    if (mode === 'hybrid') {
      const players = getPlayersFromTeam(team);

      return (
        players.reduce(
          (sum, player) => sum + getPreviousRating(player).rating,
          0,
        ) / players.length
      );
    }

    const normalizedTeamName = normalizeTeamName(team);
    return getPreviousRating(normalizedTeamName).rating;
  };

  for (const player of playersToCalculate) {
    const normalizedPlayer = normalizeTeamName(player);

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

    const playerElo: EloRating = getPreviousRating(normalizedPlayer);

    const ratingChange = calculateEloDiff(
      season,
      playerTeam.elo,
      opponentTeam.elo,
      playerTeam.score,
      opponentTeam.score,
    );

    elos[normalizedPlayer] = {
      id: match.id,
      rating: playerElo.rating + ratingChange,
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
  previousData: MatchDataFrame,
  mode: 'player' | 'team' | 'team-individual' | 'hybrid',
): Record<string, Glicko2Rating> {
  const season = getSeason(match.date);
  const previousSeason = getSeason(previousData.match.date);

  const previousRatings =
    season.number === previousSeason.number
      ? quickSwitch<Record<string, Glicko2Rating>, typeof mode>(mode, {
          player: previousData.glicko2Ratings.playerGlicko2,
          team: previousData.glicko2Ratings.teamGlicko2,
          'team-individual': previousData.glicko2Ratings.teamIndividualGlicko2,
          hybrid: previousData.glicko2Ratings.hybridGlicko2,
          default: {},
        })
      : {};

  const ratings = { ...previousRatings };

  const defaultRating: Glicko2Rating = {
    id: match.id,
    rating: season.config.defaultGlicko2Rating,

    rd: season.config.defaultGlicko2RD,

    volatility: season.config.defaultGlicko2Volatility,
  };

  const getPreviousRating = (team: string): Glicko2Rating =>
    previousRatings[team] ?? defaultRating;

  if (hasBeenCancelled(match.replayMetadata?.events)) {
    return ratings;
  }

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
      const teamRatings = players.map((player) => getPreviousRating(player));

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

    const normalizedTeamName = normalizeTeamName(team);
    return getPreviousRating(normalizedTeamName);
  };

  for (const player of playersToCalculate) {
    const normalizedPlayer = normalizeTeamName(player);

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

    const playerRating = getPreviousRating(normalizedPlayer);

    const updatedGlicko2Rating = calculateGlicko2Diff(
      playerRating,
      opponentTeam.rating,
      playerTeam.score,
      opponentTeam.score,
    );

    ratings[normalizedPlayer] = {
      id: match.id,
      ...updatedGlicko2Rating,
    };
  }

  return ratings;
}

export function getGlicko2Confidence(
  season: Season,
  rating: Glicko2Rating,
): number {
  const maxRd = season.config.defaultGlicko2RD;
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
  const normalizedTeamName = normalizeTeamName(team);
  const hash = hashString(normalizedTeamName);

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

export function getTotalMatches(_match: Match, previousStats: BaseStats) {
  return previousStats._matchCounter + 1;
}

export function getTotalGoalsWithDuration(
  match: Match,
  previousStats: BaseStats,
) {
  return (
    previousStats._goalsWithDuration +
    (match.duration ? match.score1 + match.score2 : 0)
  );
}

export function getTotalMatchesWithDuration(
  match: Match,
  previousStats: BaseStats,
) {
  return previousStats._matchesWithDuration + (match.duration ? 1 : 0);
}

export function getTotalMatchesWithTimeline(
  match: Match,
  previousStats: BaseStats,
) {
  return (
    previousStats._matchesWithTimeline + (match.replayMetadata?.events ? 1 : 0)
  );
}

export function getLastGoalEvent(
  events: MatchEvent[] | null,
): MatchEventGoal | null {
  return events?.findLast((ev) => ev.type === 'GOAL') ?? null;
}

export function convertCalculatorFinishEventToMatch(
  event: CalculatorFinishEvent,
): MatchCreate {
  const cancelled = hasBeenCancelled(event.events);
  const lastGoal = getLastGoalEvent(event.events);
  const lastHistoryGoal = event.history?.at(-1);

  const winningColor = cancelled
    ? 'unknown'
    : (lastGoal?.for ?? lastHistoryGoal ?? 'unknown');

  const duration =
    getMatchDuration(event) - getPauseDuration(event.events ?? []);

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

export function getMatchDuration(
  event: Pick<CalculatorFinishEvent, 'events' | 'startedAt'>,
): number {
  const lastEvent = event.events?.at(-1);

  const duration = lastEvent
    ? lastEvent.time - event.startedAt
    : Math.floor(Date.now() / 1000) - event.startedAt;

  return duration;
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
