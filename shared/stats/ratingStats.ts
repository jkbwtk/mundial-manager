import {
  getMatchRatedScore,
  getMatchSidePlayers,
  getMatchSideScores,
} from '#shared/matchTimeline';
import { RatingSystemDefinitions } from '#shared/stats/ratingSystems';
import { MatchStatusEnum } from '#shared/types/api/match';
import { type MatchSide, MatchSides } from '#shared/types/api/matchEvent';
import type { SeasonConfig } from '#shared/types/api/season';
import {
  type RatingStats,
  type RatingSubject,
  RatingSubjects,
} from '#shared/types/stats/ratingStats';
import {
  type RatingMatchSide,
  type RatingSystem,
  RatingSystems,
} from '#shared/types/stats/ratingSystem';
import type {
  StatsEngine,
  StatsMatch,
  StatsRatingChange,
  StatsRatingState,
} from '#shared/types/stats/statsRow';

const RatingSystemSubjects: Record<RatingSystem, readonly RatingSubject[]> = {
  ELO: RatingSubjects,
  GLICKO2: RatingSubjects,
  SKILL: ['HYBRID'],
};

function isRatingSubjectApplicable(
  match: StatsMatch,
  subject: RatingSubject,
): boolean {
  const isSingles =
    match.playersSide1.length === 1 && match.playersSide2.length === 1;

  switch (subject) {
    case 'PLAYER':
      return isSingles;
    case 'TEAM':
    case 'TEAM_INDIVIDUAL':
      return !isSingles;
    case 'HYBRID':
      return true;
  }
}

function getRatingSide(
  match: StatsMatch,
  subject: RatingSubject,
  side: MatchSide,
): RatingMatchSide {
  const [score] = getMatchSideScores(match, side);

  if (subject !== 'TEAM') {
    return { subjects: getMatchSidePlayers(match, side), score };
  }

  return {
    subjects: [
      side === 'SIDE_1'
        ? match.side1TeamConfigurationUuid
        : match.side2TeamConfigurationUuid,
    ],
    score,
  };
}

export function getStatsRatingState(
  engine: StatsEngine,
  system: RatingSystem,
  subject: RatingSubject,
  epoch: string,
): StatsRatingState | null {
  const current = engine.ratings.get(`${system}:${subject}`);

  return current?.epoch === epoch ? current : null;
}

function getOrCreateRatingState(
  engine: StatsEngine,
  system: RatingSystem,
  subject: RatingSubject,
  epoch: string,
): StatsRatingState {
  const current = getStatsRatingState(engine, system, subject, epoch);

  if (current !== null) return current;

  const next = {
    epoch,
    state: RatingSystemDefinitions[system].create(),
    ratings: new Map(),
  };

  engine.ratings.set(`${system}:${subject}`, next);

  return next;
}

export function calculateRatings(
  engine: StatsEngine,
  match: StatsMatch,
  config: SeasonConfig,
  seasonKey: string,
): StatsRatingChange[] {
  if (match.status === MatchStatusEnum.CANCELED) return [];

  const [side1Score, side2Score] = getMatchRatedScore(
    match,
    match.events,
    config.rules,
  );
  const rated = { ...match, side1Score, side2Score };

  return RatingSystems.flatMap((system) => {
    const params = config.ratings[system];
    const definition = RatingSystemDefinitions[system];

    if (!params.enabled) return [];

    return RatingSystemSubjects[system].flatMap((subject) => {
      if (!isRatingSubjectApplicable(match, subject)) return [];

      const { epoch, state, ratings } = getOrCreateRatingState(
        engine,
        system,
        subject,
        system === 'SKILL' ? seasonKey : engine.ratingEpoch,
      );
      const sides = MatchSides.map((side) =>
        getRatingSide(rated, subject, side),
      ) as [RatingMatchSide, RatingMatchSide];

      const players = new Set(sides.flatMap((side) => side.subjects));

      return definition
        .rate(state, {
          params,
          day: engine.day,
          sides,
          stakesModifier: match.stakesModifier,
        })
        .map(({ subject: uuid, before, after }): StatsRatingChange => {
          const previous = before ?? definition.initial(params);
          const next: RatingStats = {
            ...after,

            ratingChange: after.rating - previous.rating,
            matches:
              (ratings.get(uuid)?.matches ?? 0) + (players.has(uuid) ? 1 : 0),
          };

          ratings.set(uuid, next);

          return {
            system,
            subject,
            uuid,
            epoch,
            before: previous,
            after: next,
          };
        });
    });
  });
}
