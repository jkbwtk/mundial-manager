import { query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  GeneralStatsFramePaginated,
  type GeneralStatsQueryInput,
  PlayerStatsFramePaginated,
  type PlayerStatsQueryInput,
  RatingStatsFramePaginated,
  type RatingStatsQueryInput,
} from '#shared/types/api/statsFrame';

export const queryGeneralStats = query(
  async (input: GeneralStatsQueryInput) => {
    const frames = await trpcClient.stats.getGeneral.query(input);

    return GeneralStatsFramePaginated.parse(frames);
  },
  'queryGeneralStats',
);

export const queryPlayerStats = query(async (input: PlayerStatsQueryInput) => {
  const frames = await trpcClient.stats.getPlayers.query(input);

  return PlayerStatsFramePaginated.parse(frames);
}, 'queryPlayerStats');

export const queryRatingStats = query(async (input: RatingStatsQueryInput) => {
  const frames = await trpcClient.stats.getRatings.query(input);

  return RatingStatsFramePaginated.parse(frames);
}, 'queryRatingStats');
