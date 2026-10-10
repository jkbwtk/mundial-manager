import z from 'zod';
import { statsQueryDefaults } from '#shared/defaults/statsFrame';
import { StatsBucket } from '#shared/types/stats/bucket';
import { AggregateStats } from '#shared/types/stats/generalStats';
import {
  PlayerStats,
  PlayerStatsBucket,
} from '#shared/types/stats/playerStats';
import { RatingStats, RatingSubject } from '#shared/types/stats/ratingStats';
import { RatingSystem } from '#shared/types/stats/ratingSystem';
import { PaginatedResponse, withDefaults } from '#shared/zod';

const StatsFrameBase = z.object({
  matchUuid: z.uuid(),
  matchStartDate: z.coerce.date().nullable(),
  day: z.string().nullable(),
});

const keys = z.string().max(255).array().max(500);
const uuids = z.uuid().array().max(500);

function createStatsQuery<SortFields extends [string, ...string[]]>(
  sortFields: SortFields,
) {
  const query = z.object({
    history: z.boolean(),

    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),

    pagination: z
      .object({
        limit: z.number().int().positive().max(5000),
        offset: z.number().int().nonnegative(),
      })
      .optional(),
    sorting: z
      .object({
        field: z.enum(['date', ...sortFields]),
        direction: z.enum(['asc', 'desc']),
      })
      .optional(),
  });

  return withDefaults(query, statsQueryDefaults);
}

export const GeneralStatsFrame = StatsFrameBase.extend({
  bucket: StatsBucket,
  bucketKey: z.string(),

  stats: AggregateStats,
});
export type GeneralStatsFrame = z.infer<typeof GeneralStatsFrame>;

export const GeneralStatsFramePaginated = PaginatedResponse(GeneralStatsFrame);
export type GeneralStatsFramePaginated = z.infer<
  typeof GeneralStatsFramePaginated
>;

export const GeneralStatsQuery = createStatsQuery([
  'matches',
  'cancelledMatches',
  'goals',
  'ownGoalCount',
  'playtime',
  'participationTime',
  'pauseDuration',
  'individualPlaytime',
  'longestTimeBetweenGoals',
  'shortestTimeBetweenGoals',
  'leadChanges',
  'biggestLead',
  '_totalTimeBetweenGoals',
  '_timeBetweenGoalsCount',
]).extend({
  bucket: StatsBucket,
  bucketKeys: keys.optional(),
});
export type GeneralStatsQuery = z.infer<typeof GeneralStatsQuery>;
export type GeneralStatsQueryInput = z.input<typeof GeneralStatsQuery>;

export const PlayerStatsFrame = StatsFrameBase.extend({
  bucket: PlayerStatsBucket,
  bucketKey: z.string(),
  playerUuid: z.uuid(),

  stats: PlayerStats,
});
export type PlayerStatsFrame = z.infer<typeof PlayerStatsFrame>;

export const PlayerStatsFramePaginated = PaginatedResponse(PlayerStatsFrame);
export type PlayerStatsFramePaginated = z.infer<
  typeof PlayerStatsFramePaginated
>;

export const PlayerStatsQuery = createStatsQuery([
  'matches',
  'spectatedMatches',
  'wins',
  'losses',
  'draws',
  'goalsFor',
  'goalsAgainst',
  'goals',
  'ownGoals',
  'playtime',
  'participationTime',
  'longestWinStreak',
  'longestLossStreak',
]).extend({
  bucket: PlayerStatsBucket,
  bucketKeys: keys.optional(),
  players: uuids.optional(),
});
export type PlayerStatsQuery = z.infer<typeof PlayerStatsQuery>;
export type PlayerStatsQueryInput = z.input<typeof PlayerStatsQuery>;

export const RatingStatsFrame = StatsFrameBase.extend({
  system: RatingSystem,
  subject: RatingSubject,
  epoch: z.string(),
  subjectUuid: z.uuid(),

  rating: RatingStats,
});
export type RatingStatsFrame = z.infer<typeof RatingStatsFrame>;

export const RatingStatsFramePaginated = PaginatedResponse(RatingStatsFrame);
export type RatingStatsFramePaginated = z.infer<
  typeof RatingStatsFramePaginated
>;

export const RatingStatsQuery = createStatsQuery([
  'rating',
  'rd',
  'ratingChange',
  'matches',
]).extend({
  system: RatingSystem,
  subject: RatingSubject,
  epoch: z.string().max(255).optional(),
  subjectUuids: uuids.optional(),
});
export type RatingStatsQuery = z.infer<typeof RatingStatsQuery>;
export type RatingStatsQueryInput = z.input<typeof RatingStatsQuery>;
