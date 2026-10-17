import { query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import { HeadToHead, type HeadToHeadQuery } from '#shared/types/api/headToHead';
import {
  GeneralStatsSeries,
  type GeneralStatsSeriesQuery,
  MatchPrediction,
  type MatchPredictionQuery,
  PeriodMatch,
  type PeriodMatchQuery,
  PeriodStats,
  PlayerProfileStats,
  RatingHistory,
  type RatingHistoryQuery,
  type StatsPeriod,
  StatsPeriods,
  type StatsPeriodsQuery,
  StatsVersion,
} from '#shared/types/api/stats';

export const queryStatsVersion = query(async () => {
  const version = await trpcClient.stats.getVersion.query();

  return StatsVersion.parse(version);
}, 'queryStatsVersion');

export const queryStatsPeriods = query(
  async (type: StatsPeriodsQuery['type']) => {
    const periods = await trpcClient.stats.getPeriods.query({ type });

    return StatsPeriods.parse(periods);
  },
  'queryStatsPeriods',
);

export const queryPeriodStats = query(async (period: StatsPeriod | null) => {
  const stats = await trpcClient.stats.getPeriodStats.query({ period });

  return PeriodStats.parse(stats);
}, 'queryPeriodStats');

export const queryPeriodMatch = query(async (input: PeriodMatchQuery) => {
  const match = await trpcClient.stats.getPeriodMatch.query(input);

  return PeriodMatch.nullable().parse(match);
}, 'queryPeriodMatch');

export const queryPlayerProfileStats = query(async (playerUuid: string) => {
  const stats = await trpcClient.stats.getPlayerProfileStats.query({
    playerUuid,
  });

  return PlayerProfileStats.parse(stats);
}, 'queryPlayerProfileStats');

export const queryMatchPrediction = query(
  async (input: MatchPredictionQuery) => {
    const prediction = await trpcClient.stats.getMatchPrediction.query(input);

    return MatchPrediction.nullable().parse(prediction);
  },
  'queryMatchPrediction',
);

export const queryHeadToHead = query(async (input: HeadToHeadQuery) => {
  const records = await trpcClient.stats.getHeadToHead.query(input);

  return HeadToHead.array().parse(records);
}, 'queryHeadToHead');

export const queryPlayersHeadToHead = query(
  ({
    playerUuids,
    ...range
  }: Omit<HeadToHeadQuery, 'playerUuid'> & { playerUuids: string[] }) =>
    Promise.all(
      playerUuids.map(
        async (playerUuid): Promise<[string, HeadToHead[]]> => [
          playerUuid,
          await queryHeadToHead({ playerUuid, ...range }),
        ],
      ),
    ),
  'queryPlayersHeadToHead',
);

export const queryGeneralStatsSeries = query(
  async (input: GeneralStatsSeriesQuery) => {
    const series = await trpcClient.stats.getGeneralStatsSeries.query(input);

    return GeneralStatsSeries.parse(series);
  },
  'queryGeneralStatsSeries',
);

export const queryRatingHistory = query(async (input: RatingHistoryQuery) => {
  const history = await trpcClient.stats.getRatingHistory.query(input);

  return RatingHistory.parse(history);
}, 'queryRatingHistory');

export const StatsQueryKeys = [
  'queryStatsVersion',
  'queryStatsPeriods',
  'queryPeriodStats',
  'queryPeriodMatch',
  'queryPlayerProfileStats',
  'queryHeadToHead',
  'queryMatchPrediction',
  'queryGeneralStatsSeries',
  'queryRatingHistory',
];
