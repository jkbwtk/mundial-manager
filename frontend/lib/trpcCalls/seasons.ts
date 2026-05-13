import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import type { SeasonCreate } from '#shared/types/api/season';

export const querySeasons = query(async () => {
  return await trpcClient.seasons.seasons.query();
}, 'querySeasons');

export const actionCreateSeason = action(async (season: SeasonCreate) => {
  const newSeason = await trpcClient.seasons.createSeason.mutate(season);

  return json(newSeason, {
    revalidate: ['querySeasons'],
  });
}, 'actionCreateSeason');

export const querySeasonById = query(async (uuid: string) => {
  return await trpcClient.seasons.seasonById.query({ uuid });
}, 'querySeasonById');

export const queryCurrentSeason = query(async () => {
  return await trpcClient.seasons.currentSeason.query();
}, 'queryCurrentSeason');
