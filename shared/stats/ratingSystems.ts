import { defaultEloParams } from '#shared/defaults/ratingSystem';
import { average } from '#shared/stats/utils';
import type {
  EloParams,
  EloRating,
  Glicko2Params,
  Glicko2Rating,
  RatingSystem,
  RatingSystemDefinition,
} from '#shared/types/stats/ratingSystem';

const GLICKO2_CENTER = 1500;
const GLICKO2_SCALE = 173.7178;
const GLICKO2_EPSILON = 0.000001;

function getMatchOutcome(score: number, opponentScore: number): number {
  if (score > opponentScore) return 1;
  if (score === opponentScore) return 0.5;

  return 0;
}

function getEloKFactor(params: EloParams, rating: number): number {
  const thresholds = Object.entries(params.kFactorRanges)
    .flatMap(([key, value]) =>
      key === 'default' ? [] : [[Number(key), value] as const],
    )
    .toSorted((a, b) => a[0] - b[0]);

  for (const [threshold, factor] of thresholds) {
    if (rating < threshold) return factor;
  }

  return params.kFactorRanges.default ?? defaultEloParams.kFactorRanges.default;
}

function getEloScoreMultiplier(params: EloParams, scoreDiff: number): number {
  return (
    params.scoreMultipliers[scoreDiff.toString()] ??
    params.scoreMultipliers.default ??
    defaultEloParams.scoreMultipliers.default
  );
}

function calculateEloDiff(
  params: EloParams,
  rating: number,
  opponentRating: number,
  score: number,
  opponentScore: number,
): number {
  const outcome = getMatchOutcome(score, opponentScore);
  const expected = 1 / (1 + 10 ** ((opponentRating - rating) / 400));
  const multiplier =
    outcome === 1
      ? getEloScoreMultiplier(params, Math.abs(score - opponentScore))
      : 1;

  return getEloKFactor(params, rating) * multiplier * (outcome - expected);
}

function getGlicko2Weight(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function getGlicko2Expected(
  mu: number,
  opponentMu: number,
  opponentPhi: number,
): number {
  return 1 / (1 + Math.exp(-getGlicko2Weight(opponentPhi) * (mu - opponentMu)));
}

function getGlicko2VolatilityTarget(
  x: number,
  delta: number,
  phi: number,
  v: number,
  a: number,
  tau: number,
): number {
  const ex = Math.exp(x);
  const denominator = phi * phi + v + ex;

  return (
    (ex * (delta * delta - phi * phi - v - ex)) /
      (2 * denominator * denominator) -
    (x - a) / (tau * tau)
  );
}

function calculateGlicko2Rating(
  params: Glicko2Params,
  own: Glicko2Rating,
  opponent: Glicko2Rating,
  outcome: number,
): Glicko2Rating {
  const mu = (own.rating - GLICKO2_CENTER) / GLICKO2_SCALE;
  const phi = own.rd / GLICKO2_SCALE;
  const opponentMu = (opponent.rating - GLICKO2_CENTER) / GLICKO2_SCALE;
  const opponentPhi = opponent.rd / GLICKO2_SCALE;

  const weight = getGlicko2Weight(opponentPhi);
  const expected = getGlicko2Expected(mu, opponentMu, opponentPhi);
  const v = 1 / (weight * weight * expected * (1 - expected));
  const delta = v * weight * (outcome - expected);

  const target = (x: number) =>
    getGlicko2VolatilityTarget(
      x,
      delta,
      phi,
      v,
      Math.log(own.volatility * own.volatility),
      params.tau,
    );

  let a = Math.log(own.volatility * own.volatility);
  let b: number;

  if (delta * delta > phi * phi + v) {
    b = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;

    while (target(a - k * params.tau) < 0) {
      k += 1;
    }

    b = a - k * params.tau;
  }

  let fa = target(a);
  let fb = target(b);

  while (Math.abs(b - a) > GLICKO2_EPSILON) {
    const c = a + ((a - b) * fa) / (fb - fa);
    const fc = target(c);

    if (fc * fb < 0) {
      a = b;
      fa = fb;
    } else {
      fa /= 2;
    }

    b = c;
    fb = fc;
  }

  const volatility = Math.exp(a / 2);
  const phiStar = Math.sqrt(phi * phi + volatility * volatility);
  const nextPhi = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const nextMu = mu + nextPhi * nextPhi * weight * (outcome - expected);

  return {
    rating: nextMu * GLICKO2_SCALE + GLICKO2_CENTER,
    rd: nextPhi * GLICKO2_SCALE,
    volatility,
  };
}

export const eloRatingSystem = {
  initial: (params) => ({ rating: params.defaultRating }),

  combine: (ratings) => ({
    rating: average(ratings.map((rating) => rating.rating)),
  }),

  update: (params, matchup) => ({
    rating:
      matchup.own.rating +
      calculateEloDiff(
        params,
        matchup.side.rating,
        matchup.opponent.rating,
        matchup.score,
        matchup.opponentScore,
      ),
  }),
} satisfies RatingSystemDefinition<EloParams, EloRating>;

export const glicko2RatingSystem = {
  initial: (params) => ({
    rating: params.defaultRating,
    rd: params.defaultRd,
    volatility: params.defaultVolatility,
  }),

  combine: (ratings) => ({
    rating: average(ratings.map((rating) => rating.rating)),
    rd: average(ratings.map((rating) => rating.rd)),
    volatility: average(ratings.map((rating) => rating.volatility)),
  }),

  update: (params, matchup) =>
    calculateGlicko2Rating(
      params,
      matchup.own,
      matchup.opponent,
      getMatchOutcome(matchup.score, matchup.opponentScore),
    ),
} satisfies RatingSystemDefinition<Glicko2Params, Glicko2Rating>;

export const ratingSystemDefinitions: Record<
  RatingSystem,
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  RatingSystemDefinition<any, any>
> = {
  ELO: eloRatingSystem,
  GLICKO2: glicko2RatingSystem,
};
