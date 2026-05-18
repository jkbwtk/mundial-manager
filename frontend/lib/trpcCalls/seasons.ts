import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import type { SeasonCreate, SeasonUpdate } from '#shared/types/api/season';

export const querySeasons = query(async () => {
  return await trpcClient.seasons.seasons.query();
}, 'querySeasons');

export const actionCreateSeason = action(async (season: SeasonCreate) => {
  const newSeason = await trpcClient.seasons.createSeason.mutate(season);

  return json(newSeason, {
    revalidate: ['querySeasons'],
  });
}, 'actionCreateSeason');

export const actionUpdateSeason = action(async (season: SeasonUpdate) => {
  const updatedSeason = await trpcClient.seasons.updateSeason.mutate(season);

  return json(updatedSeason, {
    revalidate: ['querySeasons'],
  });
}, 'actionUpdateSeason');

export const actionDeleteSeason = action(async (uuid: string) => {
  const deletedSeason = await trpcClient.seasons.deleteSeason.mutate({ uuid });

  return json(deletedSeason, {
    revalidate: ['querySeasons'],
  });
}, 'actionDeleteSeason');

export const querySeasonById = query(async (uuid: string) => {
  return await trpcClient.seasons.seasonById.query({ uuid });
}, 'querySeasonById');

export const queryCurrentSeason = query(async () => {
  return await trpcClient.seasons.currentSeason.query();
}, 'queryCurrentSeason');
