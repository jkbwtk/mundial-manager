import type { MatchRules } from '#shared/types/api/season';

type MatchScore = [side1: number, side2: number];

interface MatchScoreProbability {
  score: MatchScore;
  probability: number;
}

const MIN_SCORE_PROBABILITY = 0.000001;

export function isMatchFinished(score: MatchScore, rules: MatchRules): boolean {
  const [a, b] = score;

  if (Math.max(a, b) < rules.target) return false;
  if (!rules.winByTwo) return true;

  return Math.abs(a - b) >= 2 || Math.min(a, b) < rules.target - 1;
}

function getDeuceWinProbability(
  lead: number,
  p: number,
  q: number,
  fromTie: number,
): number {
  if (lead === 0) return fromTie;

  return lead > 0 ? p + q * fromTie : p * fromTie;
}

export function createMatchWinProbability(
  goalShare: number, // probability that side 1 scores the next goal
  rules: MatchRules,
): (score: MatchScore) => number {
  const p = goalShare;
  const q = 1 - goalShare;
  const memo = new Map<string, number>();

  const win = (a: number, b: number): number => {
    if (isMatchFinished([a, b], rules)) return a > b ? 1 : 0;

    const deuce = rules.target - 1;

    if (rules.winByTwo && a >= deuce && b >= deuce) {
      const fromTie = (p * p) / (p * p + q * q);

      return getDeuceWinProbability(a - b, p, q, fromTie);
    }

    const key = `${a}:${b}`;
    const cached = memo.get(key);

    if (cached !== undefined) return cached;

    const value = p * win(a + 1, b) + q * win(a, b + 1);

    memo.set(key, value);

    return value;
  };

  return ([a, b]) => win(a, b);
}

function addScoreProbability(
  target: Map<string, MatchScoreProbability>,
  entry: MatchScoreProbability,
): void {
  const key = `${entry.score}`;

  target.set(key, {
    score: entry.score,
    probability: (target.get(key)?.probability ?? 0) + entry.probability,
  });
}

export function getMostLikelyFinalScore(
  goalShare: number, // probability that side 1 scores the next goal
  rules: MatchRules,
  score: MatchScore,
): MatchScoreProbability {
  const finals = new Map<string, MatchScoreProbability>();

  let open = new Map([[`${score}`, { score, probability: 1 }]]);

  while (open.size > 0) {
    const next = new Map<string, MatchScoreProbability>();

    for (const {
      score: [a, b],
      probability,
    } of open.values()) {
      if (isMatchFinished([a, b], rules)) {
        addScoreProbability(finals, { score: [a, b], probability });
        continue;
      }

      if (probability < MIN_SCORE_PROBABILITY) continue;

      addScoreProbability(next, {
        score: [a + 1, b],
        probability: probability * goalShare,
      });
      addScoreProbability(next, {
        score: [a, b + 1],
        probability: probability * (1 - goalShare),
      });
    }

    open = next;
  }

  return [...finals.values()].reduce(
    (best, entry) => (entry.probability > best.probability ? entry : best),
    { score, probability: 0 },
  );
}
