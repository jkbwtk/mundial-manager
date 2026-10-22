import { defaultEloParams } from '#shared/defaults/ratingSystem';
import { skillRatingSystem } from '#shared/stats/skillRating';
import { average } from '#shared/stats/utils';
import type {
  EloParams,
  EloRating,
  Glicko2Params,
  Glicko2Rating,
  RatingMatch,
  RatingResult,
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
  stakesModifier: number,
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
  const nextMu =
    mu + stakesModifier * nextPhi * nextPhi * weight * (outcome - expected);

  return {
    rating: nextMu * GLICKO2_SCALE + GLICKO2_CENTER,
    rd: nextPhi * GLICKO2_SCALE,
    volatility,
  };
}

function getRatingSides<Rating extends EloRating>(
  match: RatingMatch<unknown>,
  ratings: Map<string, Rating>,
  initial: Rating,
  combine: (ratings: Rating[]) => Rating,
) {
  return match.sides.map((side) => {
    const before = side.subjects.map((subject) => ratings.get(subject) ?? null);

    return {
      ...side,
      before,
      strength: combine(before.map((rating) => rating ?? initial)),
    };
  });
}

function rateSides<Rating extends EloRating>(
  match: RatingMatch<unknown>,
  ratings: Map<string, Rating>,
  initial: Rating,
  combine: (ratings: Rating[]) => Rating,
  update: (
    own: Rating,
    side: Rating,
    opponent: Rating,
    score: number,
    opponentScore: number,
  ) => Rating,
): RatingResult<Rating>[] {
  const sides = getRatingSides(match, ratings, initial, combine);

  const results = sides.flatMap((side, index) => {
    const opponent = sides[index === 0 ? 1 : 0]!;

    return side.subjects.map((subject, subjectIndex) => {
      const before = side.before[subjectIndex] ?? null;

      return {
        subject,
        before,
        after: update(
          before ?? initial,
          side.strength,
          opponent.strength,
          side.score,
          opponent.score,
        ),
      };
    });
  });

  for (const { subject, after } of results) {
    ratings.set(subject, after);
  }

  return results;
}

function combineEloRatings(ratings: EloRating[]): EloRating {
  return { rating: average(ratings.map((rating) => rating.rating)) };
}

function combineGlicko2Ratings(ratings: Glicko2Rating[]): Glicko2Rating {
  return {
    rating: average(ratings.map((rating) => rating.rating)),
    rd: average(ratings.map((rating) => rating.rd)),
    volatility: average(ratings.map((rating) => rating.volatility)),
  };
}

function getInitialGlicko2Rating(params: Glicko2Params): Glicko2Rating {
  return {
    rating: params.defaultRating,
    rd: params.defaultRd,
    volatility: params.defaultVolatility,
  };
}

export const eloRatingSystem = {
  initial: (params) => ({ rating: params.defaultRating }),

  create: () => new Map(),

  rate: (ratings, match) =>
    rateSides(
      match,
      ratings,
      { rating: match.params.defaultRating },
      combineEloRatings,
      (own, side, opponent, score, opponentScore) => ({
        rating:
          own.rating +
          calculateEloDiff(
            match.params,
            side.rating,
            opponent.rating,
            score,
            opponentScore,
          ) *
            match.stakesModifier,
      }),
    ),
} satisfies RatingSystemDefinition<
  EloParams,
  EloRating,
  Map<string, EloRating>
>;

export const glicko2RatingSystem = {
  initial: getInitialGlicko2Rating,

  create: () => new Map(),

  rate: (ratings, match) =>
    rateSides(
      match,
      ratings,
      getInitialGlicko2Rating(match.params),
      combineGlicko2Ratings,
      (own, _side, opponent, score, opponentScore) =>
        calculateGlicko2Rating(
          match.params,
          own,
          opponent,
          getMatchOutcome(score, opponentScore),
          match.stakesModifier,
        ),
    ),
} satisfies RatingSystemDefinition<
  Glicko2Params,
  Glicko2Rating,
  Map<string, Glicko2Rating>
>;

export const RatingSystemDefinitions: Record<
  RatingSystem,
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  RatingSystemDefinition<any, any, any>
> = {
  ELO: eloRatingSystem,
  GLICKO2: glicko2RatingSystem,
  SKILL: skillRatingSystem,
};
