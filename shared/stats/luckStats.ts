import {
  getMatchRatedScore,
  getMatchTimelineSteps,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import { createMatchWinProbability } from '#shared/stats/matchProbability';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { MatchRules } from '#shared/types/api/season';
import type { LuckStats } from '#shared/types/stats/luckStats';
import type {
  StatsMatch,
  StatsRow,
  StatsRowLuck,
} from '#shared/types/stats/statsRow';

interface LuckAccumulator {
  matches: number;
  wins: number;
  expectedWins: number;
  goalsFor: number;
  goalsAgainst: number;
  rules: Map<string, [rules: MatchRules, count: number]>;
  bestComeback: LuckStats['bestComeback'];
}

const LUCK_SHARE = 0.8; // share of overperformance not explained by day form

function getWinnerProbability(
  winProbability: (score: [number, number]) => number,
  score: [number, number],
  winner: MatchSide,
): number {
  const probability = winProbability(score);

  return winner === 'SIDE_1' ? probability : 1 - probability;
}

function getComeback(
  match: StatsMatch,
  winProbability: (score: [number, number]) => number,
  winner: MatchSide,
): StatsRowLuck['comeback'] {
  const goals = getMatchTimelineSteps(match.events).filter(
    ({ event }) => event.type === 'GOAL',
  );

  if (goals.length !== match.side1Score + match.side2Score) return null;

  let bestComeback: StatsRowLuck['comeback'] = { probability: 1, score: '0:0' };

  for (const { score } of goals.slice(0, -1)) {
    const probability = getWinnerProbability(winProbability, score, winner);
    const [own, opponent] = winner === 'SIDE_1' ? score : [score[1], score[0]];

    if (probability < (bestComeback?.probability ?? 1)) {
      bestComeback = { probability, score: `${own}:${opponent}` };
    }
  }

  return bestComeback;
}

export function calculateStatsRowLuck(
  match: StatsMatch,
  rules: MatchRules,
  goalShare: number,
): StatsRowLuck | null {
  const score = getMatchRatedScore(match, match.events, rules);

  if (match.status === 'CANCELED' || score[0] + score[1] === 0) {
    return null;
  }

  const winProbability = createMatchWinProbability(goalShare, rules);
  const expectedWin = winProbability([0, 0]);
  const winner = getMatchWinningSide(match, match.events);
  const hasComeback =
    winner !== null &&
    match.status !== 'SURRENDERED' &&
    match.events.length > 0;

  return {
    rules,
    score,

    expectedWins: [expectedWin, 1 - expectedWin],
    winner,
    comeback: hasComeback ? getComeback(match, winProbability, winner) : null,
  };
}

export function calculateLuckStats(
  rows: StatsRow[],
): [uuid: string, stats: LuckStats][] {
  const accumulators = new Map<string, LuckAccumulator>();

  for (const row of rows) {
    const { luck } = row;

    if (luck === null) continue;

    for (const player of row.players) {
      if (player.side === null) continue;

      const won = player.side === luck.winner;
      const index = player.side === 'SIDE_1' ? 0 : 1;
      const accumulator = accumulators.getOrInsertComputed(player.uuid, () => ({
        matches: 0,
        wins: 0,
        expectedWins: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        rules: new Map(),
        bestComeback: null,
      }));

      accumulator.matches += 1;
      accumulator.wins += won ? 1 : 0;
      accumulator.expectedWins += luck.expectedWins[index];
      accumulator.goalsFor += luck.score[index];
      accumulator.goalsAgainst += luck.score[1 - index]!;
      const rulesKey = `${luck.rules.target}:${luck.rules.winByTwo}`;

      accumulator.rules.set(rulesKey, [
        luck.rules,
        (accumulator.rules.get(rulesKey)?.[1] ?? 0) + 1,
      ]);

      if (
        won &&
        luck.comeback !== null &&
        luck.comeback.probability <
          (accumulator.bestComeback?.probability ?? Number.POSITIVE_INFINITY)
      ) {
        accumulator.bestComeback = {
          ...luck.comeback,
          matchUuid: row.match.uuid,
          startDate: row.match.startDate,
        };
      }
    }
  }

  return [...accumulators].map(([uuid, accumulator]) => {
    const goalShare =
      accumulator.goalsFor / (accumulator.goalsFor + accumulator.goalsAgainst);
    const goalWins = [...accumulator.rules.values()].reduce(
      (sum, [rules, count]) =>
        sum + count * createMatchWinProbability(goalShare, rules)([0, 0]),
      0,
    );

    return [
      uuid,
      {
        matches: accumulator.matches,
        wins: accumulator.wins,

        expectedWins: accumulator.expectedWins,
        goalWins,
        luck:
          accumulator.wins -
          goalWins +
          LUCK_SHARE * (goalWins - accumulator.expectedWins),

        bestComeback: accumulator.bestComeback,
      },
    ];
  });
}
