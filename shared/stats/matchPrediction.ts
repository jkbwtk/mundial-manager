import { defaultSeasonConfig } from '#shared/defaults/season';
import { getGoalScoringSide } from '#shared/matchTimeline';
import {
  getStatsDayIndex,
  getStatsDayKey,
  getStatsSeason,
} from '#shared/stats/buckets';
import {
  createMatchWinProbability,
  getMostLikelyFinalScore,
  isMatchFinished,
} from '#shared/stats/matchProbability';
import { getStatsRatingState } from '#shared/stats/ratingStats';
import { getSkillGoalShare, getSkillRatings } from '#shared/stats/skillRating';
import { calculateMatchStylePoints } from '#shared/stats/stylePoints';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import type { SeasonConfig } from '#shared/types/api/season';
import type {
  MatchPrediction,
  MatchPredictionQuery,
} from '#shared/types/api/stats';
import type {
  LiveMatchPrediction,
  LiveMatchPredictionInput,
} from '#shared/types/MundialCalculator';
import type { StatsEngine } from '#shared/types/stats/statsRow';

export function getMatchPrediction(
  engine: StatsEngine,
  query: MatchPredictionQuery,
  now: Date,
): MatchPrediction | null {
  const season = getStatsSeason(
    { startDate: now, labels: {} },
    engine.input.seasons,
  );
  const config: SeasonConfig = season?.config ?? defaultSeasonConfig;
  const params = config.ratings.SKILL;

  if (!params.enabled) return null;

  const epoch = season?.uuid ?? engine.seasonKey ?? '';
  const ratingState = getStatsRatingState(engine, 'SKILL', 'HYBRID', epoch);
  const day = getStatsDayIndex(getStatsDayKey(now, engine.input.timeZone));

  const getSideRatings = (uuids: string[]) =>
    getSkillRatings(ratingState?.state ?? null, uuids, params, day);

  const side1 = getSideRatings(query.playersSide1);
  const side2 = getSideRatings(query.playersSide2);
  const uuids = [...query.playersSide1, ...query.playersSide2];

  return {
    seasonUuid: season?.uuid ?? null,

    rules: config.rules,
    stylePoints: config.stylePoints,
    goalTypePoints: Object.fromEntries(
      [...engine.stylePoints].map(([uuid, stylePoints]) => [
        uuid,
        config.goalTypes[uuid]?.stylePoints ?? stylePoints,
      ]),
    ),

    goalShare: getSkillGoalShare(
      [side1.map(({ rating }) => rating), side2.map(({ rating }) => rating)],
      params,
    ),
    players: [...side1, ...side2].map((rating, index) => ({
      uuid: uuids[index]!,

      rating: rating.rating,
      rd: rating.rd,
      matches: ratingState?.ratings.get(uuids[index]!)?.matches ?? 0,
    })),
  };
}

export function getLiveMatchPrediction(
  prediction: MatchPrediction,
  input: LiveMatchPredictionInput,
): LiveMatchPrediction {
  const score: [number, number] = [0, 0];

  for (const goal of input.goals) {
    score[getGoalScoringSide(goal) === 'SIDE_1' ? 0 : 1] += 1;
  }

  const winProbability = createMatchWinProbability(
    prediction.goalShare,
    prediction.rules,
  );
  const events = input.goals.map(
    (goal, index): MatchEvent => ({
      ...goal,
      uuid: '',
      type: 'GOAL',
      offset: index,
      labels: {},
    }),
  );

  return {
    score,

    winProbability: winProbability(score),
    preMatchWinProbability: winProbability([0, 0]),
    expectedScore: getMostLikelyFinalScore(
      prediction.goalShare,
      prediction.rules,
      score,
    ),

    stylePoints: calculateMatchStylePoints(
      {
        status: isMatchFinished(score, prediction.rules)
          ? 'FINISHED'
          : 'ONGOING',
        events,
        side1Score: score[0],
        side2Score: score[1],
        playersSide1: input.playersSide1,
        playersSide2: input.playersSide2,
      },
      prediction.stylePoints,
      (uuid) => prediction.goalTypePoints[uuid] ?? 0,
    ),
  };
}
