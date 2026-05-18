import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import type { LeagueCreate, LeagueUpdate } from '#shared/types/api/league';

export const queryLeagues = query(async () => {
  return await trpcClient.admin.leagues.query();
}, 'queryLeagues');

export const actionChangeLeague = action(async (uuid: string) => {
  const league = await trpcClient.admin.changeLeague$.mutate({ uuid });

  return json(league, {
    revalidate: ['queryActiveLeague'],
  });
}, 'actionChangeLeague');

export const actionCreateLeague = action(async (league: LeagueCreate) => {
  const newLeague = await trpcClient.admin.createLeague.mutate(league);

  return json(newLeague, {
    revalidate: ['queryLeagues'],
  });
}, 'actionCreateLeague');

export const actionUpdateLeague = action(async (league: LeagueUpdate) => {
  const updatedLeague = await trpcClient.admin.updateLeague.mutate(league);

  return json(updatedLeague, {
    revalidate: ['queryLeagues'],
  });
}, 'actionUpdateLeague');

export const actionDeleteLeague = action(async (uuid: string) => {
  const deletedLeague = await trpcClient.admin.deleteLeague.mutate({ uuid });

  return json(deletedLeague, {
    revalidate: ['queryLeagues'],
  });
}, 'actionDeleteLeague');

export const queryLeagueLink = query(async (uuid: string) => {
  const resp = await trpcClient.admin.leagueLink.query({ uuid });

  return resp.link;
}, 'queryLeagueLink');
