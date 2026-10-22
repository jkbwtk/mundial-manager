import type {
  RatingMatch,
  RatingResult,
  RatingSystemDefinition,
  SkillParams,
  SkillRating,
} from '#shared/types/stats/ratingSystem';

interface SkillNode {
  day: number;
  skill: number;
  variance: number;
  entries: SkillEntry[];
}

interface SkillEntry {
  game: SkillGame;
  side: 0 | 1;
}

interface SkillGame {
  nodes: [SkillNode[], SkillNode[]];
  goals: [number, number];
  stakesModifier: number;
}

interface SkillPlayer {
  nodes: SkillNode[];
}

type SkillModel = Map<string, SkillPlayer>;

const SKILL_SCALE = 400 / Math.LN10; // rating points per unit of log-odds

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function getSideStrength(nodes: SkillNode[]): number {
  return nodes.reduce((sum, node) => sum + node.skill, 0) / nodes.length;
}

function getStrengthDifference(
  own: SkillNode[],
  opponents: SkillNode[],
  params: SkillParams,
): number {
  return (
    getSideStrength(own) -
    getSideStrength(opponents) +
    ((own.length - opponents.length) * params.extraPlayerAdvantage) /
      SKILL_SCALE
  );
}

function getPlayerNode(player: SkillPlayer, day: number): SkillNode {
  const last = player.nodes.at(-1);

  if (last !== undefined && last.day === day) return last;

  const node: SkillNode = {
    day,
    skill: last?.skill ?? 0,
    variance: 0,
    entries: [],
  };

  player.nodes.push(node);

  return node;
}

function addSkillGame(model: SkillModel, match: RatingMatch<SkillParams>) {
  const game: SkillGame = {
    nodes: [[], []],
    goals: [match.sides[0].score, match.sides[1].score],
    stakesModifier: match.stakesModifier,
  };

  for (const side of [0, 1] as const) {
    for (const uuid of match.sides[side].subjects) {
      const player = model.getOrInsertComputed(uuid, () => ({ nodes: [] }));
      const node = getPlayerNode(player, match.day);

      node.entries.push({ game, side });
      game.nodes[side].push(node);
    }
  }
}

function updateSkillPlayer(player: SkillPlayer, params: SkillParams): number {
  const { nodes } = player;
  const count = nodes.length;

  const priorPrecision = (SKILL_SCALE / params.defaultRd) ** 2;
  const driftVariance = (params.driftPerDay / SKILL_SCALE) ** 2;

  const gradient = new Float64Array(count);
  const diagonal = new Float64Array(count);
  const coupling = new Float64Array(count);

  const getDriftPrecision = (from: SkillNode, to: SkillNode) =>
    1 / (driftVariance * (to.day - from.day));

  for (let index = 0; index < count; index += 1) {
    const node = nodes[index]!;
    const previous = nodes[index - 1];
    const next = nodes[index + 1];

    let nodeGradient = index === 0 ? -priorPrecision * node.skill : 0;
    let nodeCurvature = index === 0 ? priorPrecision : 0;

    for (const { game, side } of node.entries) {
      const own = game.nodes[side];
      const delta = getStrengthDifference(own, game.nodes[1 - side]!, params);
      const share = 1 / own.length;
      const weight = params.goalWeight * game.stakesModifier;
      const scored = game.goals[side];
      const conceded = game.goals[1 - side]!;

      nodeGradient +=
        weight * share * (scored * sigmoid(-delta) - conceded * sigmoid(delta));
      nodeCurvature +=
        weight *
        (scored + conceded) *
        sigmoid(delta) *
        sigmoid(-delta) *
        share *
        share;
    }

    if (previous !== undefined) {
      const precision = getDriftPrecision(previous, node);

      nodeGradient -= precision * (node.skill - previous.skill);
      nodeCurvature += precision;
    }

    if (next !== undefined) {
      const precision = getDriftPrecision(node, next);

      nodeGradient += precision * (next.skill - node.skill);
      nodeCurvature += precision;
      coupling[index] = -precision;
    }

    gradient[index] = nodeGradient;
    diagonal[index] = nodeCurvature;
  }

  const pivots = new Float64Array(count);
  const solution = new Float64Array(count);

  pivots[0] = diagonal[0]!;
  solution[0] = gradient[0]!;

  for (let index = 1; index < count; index += 1) {
    const factor = coupling[index - 1]! / pivots[index - 1]!;

    pivots[index] = diagonal[index]! - factor * coupling[index - 1]!;
    solution[index] = gradient[index]! - factor * solution[index - 1]!;
  }

  let largestStep = 0;

  for (let index = count - 1; index >= 0; index -= 1) {
    const step =
      (solution[index]! -
        (index < count - 1 ? coupling[index]! * solution[index + 1]! : 0)) /
      pivots[index]!;

    solution[index] = step;
    nodes[index]!.skill += step;
    largestStep = Math.max(largestStep, Math.abs(step));
  }

  nodes[count - 1]!.variance = 1 / pivots[count - 1]!;

  return largestStep;
}

function fitSkillModel(model: SkillModel, params: SkillParams): void {
  for (let sweep = 0; sweep < params.maxSweeps; sweep += 1) {
    let largestStep = 0;

    for (const player of model.values()) {
      largestStep = Math.max(largestStep, updateSkillPlayer(player, params));
    }

    if (largestStep < params.tolerance) return;
  }
}

function getSkillRating(
  model: SkillModel,
  uuid: string,
  params: SkillParams,
  day: number,
): SkillRating | null {
  const last = model.get(uuid)?.nodes.at(-1);

  if (last === undefined) return null;

  const driftVariance = (params.driftPerDay / SKILL_SCALE) ** 2;
  const variance = last.variance + driftVariance * Math.max(0, day - last.day);

  return {
    rating: params.defaultRating + last.skill * SKILL_SCALE,
    rd: Math.sqrt(variance) * SKILL_SCALE,
  };
}

export function getSkillRatings(
  state: unknown,
  uuids: string[],
  params: SkillParams,
  day: number,
): SkillRating[] {
  const model = (state ?? new Map()) as SkillModel;

  return uuids.map(
    (uuid) =>
      getSkillRating(model, uuid, params, day) ?? {
        rating: params.defaultRating,
        rd: params.defaultRd,
      },
  );
}

export function getSkillGoalShare(
  ratings: [side1: number[], side2: number[]],
  params: SkillParams,
): number {
  const getStrength = (side: number[]) =>
    side.reduce((sum, rating) => sum + rating - params.defaultRating, 0) /
    side.length /
    SKILL_SCALE;
  const advantage =
    ((ratings[0].length - ratings[1].length) * params.extraPlayerAdvantage) /
    SKILL_SCALE;

  return sigmoid(getStrength(ratings[0]) - getStrength(ratings[1]) + advantage);
}

export const skillRatingSystem = {
  initial: (params) => ({
    rating: params.defaultRating,
    rd: params.defaultRd,
  }),

  create: () => new Map(),

  rate: (model, match): RatingResult<SkillRating>[] => {
    const subjects = [
      ...new Set([
        ...match.sides.flatMap((side) => side.subjects),
        ...model.keys(),
      ]),
    ];
    const before = subjects.map((uuid) =>
      getSkillRating(model, uuid, match.params, match.day),
    );

    if (match.sides[0].score + match.sides[1].score > 0) {
      addSkillGame(model, match);
      fitSkillModel(model, match.params);
    }

    return subjects.map((subject, index) => ({
      subject,
      before: before[index] ?? null,
      after: getSkillRating(model, subject, match.params, match.day) ?? {
        rating: match.params.defaultRating,
        rd: match.params.defaultRd,
      },
    }));
  },
} satisfies RatingSystemDefinition<SkillParams, SkillRating, SkillModel>;
