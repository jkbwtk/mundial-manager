import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Season,
  type SeasonCreate,
  SeasonNullable,
  type SeasonUpdate,
} from '#shared/types/api/season';
import { PaginatedResponse } from '#shared/zod';

export const querySeasons = query(async () => {
  const seasons = await trpcClient.seasons.seasons.query();

  return PaginatedResponse(Season).parse(seasons);
}, 'querySeasons');

export const actionCreateSeason = action(async (season: SeasonCreate) => {
  const newSeason = await trpcClient.seasons.createSeason.mutate(season);

  return json(Season.parse(newSeason), {
    revalidate: ['querySeasons', 'queryCurrentSeason'],
  });
}, 'actionCreateSeason');

export const actionUpdateSeason = action(async (season: SeasonUpdate) => {
  const updatedSeason = await trpcClient.seasons.updateSeason.mutate(season);

  return json(Season.parse(updatedSeason), {
    revalidate: ['querySeasons', 'querySeasonById', 'queryCurrentSeason'],
  });
}, 'actionUpdateSeason');

export const actionDeleteSeason = action(async (uuid: string) => {
  const deletedSeason = await trpcClient.seasons.deleteSeason.mutate({ uuid });

  return json(Season.parse(deletedSeason), {
    revalidate: ['querySeasons', 'querySeasonById', 'queryCurrentSeason'],
  });
}, 'actionDeleteSeason');

export const querySeasonById = query(async (uuid: string) => {
  const season = await trpcClient.seasons.seasonById.query({ uuid });

  return Season.parse(season);
}, 'querySeasonById');

export const queryCurrentSeason = query(async () => {
  const currentSeason = await trpcClient.seasons.seasonByDate.query({
    date: new Date(),
  });

  return SeasonNullable.parse(currentSeason);
}, 'queryCurrentSeason');
