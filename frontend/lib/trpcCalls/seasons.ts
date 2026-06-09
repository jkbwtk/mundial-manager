import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Season,
  type SeasonCreate,
  SeasonNullable,
  type SeasonQueryMeta,
  type SeasonUpdate,
} from '#shared/types/api/season';
import { PaginatedResponse } from '#shared/zod';

export const querySeasons = query(async (meta: SeasonQueryMeta = {}) => {
  const seasons = await trpcClient.seasons.getAll.query(meta);

  return PaginatedResponse(Season).parse(seasons);
}, 'querySeasons');

export const actionCreateSeason = action(async (season: SeasonCreate) => {
  const newSeason = await trpcClient.seasons.create.mutate(season);

  return json(Season.parse(newSeason), {
    revalidate: ['querySeasons', 'queryCurrentSeason'],
  });
}, 'actionCreateSeason');

export const actionUpdateSeason = action(async (season: SeasonUpdate) => {
  const updatedSeason = await trpcClient.seasons.update.mutate(season);

  return json(Season.parse(updatedSeason), {
    revalidate: ['querySeasons', 'querySeasonById', 'queryCurrentSeason'],
  });
}, 'actionUpdateSeason');

export const actionDeleteSeason = action(async (uuid: string) => {
  const deletedSeason = await trpcClient.seasons.delete.mutate({ uuid });

  return json(Season.parse(deletedSeason), {
    revalidate: ['querySeasons', 'querySeasonById', 'queryCurrentSeason'],
  });
}, 'actionDeleteSeason');

export const querySeasonById = query(async (uuid: string) => {
  const season = await trpcClient.seasons.getById.query({ uuid });

  return Season.parse(season);
}, 'querySeasonById');

export const queryCurrentSeason = query(async () => {
  const currentSeason = await trpcClient.seasons.seasonByDate.query({
    date: new Date(),
  });

  return SeasonNullable.parse(currentSeason);
}, 'queryCurrentSeason');
