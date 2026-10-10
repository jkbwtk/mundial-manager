import { getMatchSidePlayers, getMatchSideScores } from '#shared/matchTimeline';
import { ratingSystemDefinitions } from '#shared/stats/ratingSystems';
import { MatchStatusEnum } from '#shared/types/api/match';
import { type MatchSide, MatchSides } from '#shared/types/api/matchEvent';
import {
  RatingStats,
  RatingSubject,
  RatingSubjects,
} from '#shared/types/stats/ratingStats';
import { RatingSystem, RatingSystems } from '#shared/types/stats/ratingSystem';
import type { StatsMatchContext } from '#shared/types/stats/statsEngine';
import type { StatsFrameKey } from '#shared/types/stats/statsFrame';
import type {
  StatsModule,
  StatsModuleEntry,
  StatsStateGetter,
} from '#shared/types/stats/statsModule';

function isRatingSubjectApplicable(
  context: StatsMatchContext,
  subject: RatingSubject,
): boolean {
  const { playersSide1, playersSide2 } = context.match;
  const isSingles = playersSide1.length === 1 && playersSide2.length === 1;

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

function getRatingSubjectUuids(
  context: StatsMatchContext,
  subject: RatingSubject,
  side: MatchSide,
): string[] {
  const { match } = context;

  if (subject !== 'TEAM') return getMatchSidePlayers(match, side);

  return [
    side === 'SIDE_1'
      ? match.side1TeamConfigurationUuid
      : match.side2TeamConfigurationUuid,
  ];
}

export function getRatingBucket(
  system: RatingSystem,
  subject: RatingSubject,
): string {
  return `${system}:${subject}`;
}

export function parseRatingBucket(
  bucket: string,
): [system: RatingSystem, subject: RatingSubject] | null {
  const [system, subject] = bucket.split(':');
  const parsedSystem = RatingSystem.safeParse(system);
  const parsedSubject = RatingSubject.safeParse(subject);

  if (!parsedSystem.success || !parsedSubject.success) return null;

  return [parsedSystem.data, parsedSubject.data];
}

function calculateRatings(
  context: StatsMatchContext,
  getState: StatsStateGetter<RatingStats>,
  system: RatingSystem,
): StatsModuleEntry<RatingStats>[] {
  const definition = ratingSystemDefinitions[system];
  const params = context.config.ratings[system];
  const bucketKey = context.current.ratingEpoch;

  const getSubject = (key: StatsFrameKey) => {
    const previous = getState(key);

    if (previous === null) {
      return { key, matches: 0, rating: definition.initial(params) };
    }

    const { ratingChange: _ratingChange, matches, ...rating } = previous;

    return { key, matches, rating };
  };

  return RatingSubjects.flatMap((subject) => {
    if (!isRatingSubjectApplicable(context, subject)) return [];

    const bucket = getRatingBucket(system, subject);
    const sides = MatchSides.map((side) => {
      const subjects = getRatingSubjectUuids(context, subject, side).map(
        (uuid) => getSubject({ bucket, bucketKey, subject: uuid }),
      );

      return {
        subjects,
        scores: getMatchSideScores(context.match, side),
        strength: definition.combine(subjects.map(({ rating }) => rating)),
      };
    });

    return sides.flatMap((side, index) => {
      const opponent = sides[index === 0 ? 1 : 0]!;
      const [score, opponentScore] = side.scores;

      return side.subjects.map(({ key, matches, rating }) => {
        const next = definition.update(params, {
          own: rating,
          side: side.strength,
          opponent: opponent.strength,
          score,
          opponentScore,
        });

        return {
          ...key,
          state: {
            ...next,

            ratingChange: next.rating - rating.rating,
            matches: matches + 1,
          },
        };
      });
    });
  });
}

export const ratingStatsModule = {
  state: RatingStats,

  getResumeFilters: (previous) =>
    RatingSystems.flatMap((system) =>
      RatingSubjects.map((subject) => ({
        bucket: getRatingBucket(system, subject),
        bucketKey: previous.ratingEpoch,
      })),
    ),

  apply: (context, getState) => {
    if (context.match.status === MatchStatusEnum.CANCELED) return [];

    const systems = RatingSystems.filter(
      (system) => context.config.ratings[system].enabled,
    );

    return systems.flatMap((system) =>
      calculateRatings(context, getState, system),
    );
  },
} satisfies StatsModule<RatingStats>;
