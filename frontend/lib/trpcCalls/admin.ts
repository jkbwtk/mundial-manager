import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import type { LeagueCreate } from '#shared/types/api/league';

export const queryLeagues = query(async () => {
  return await trpcClient.admin.leagues.query();
}, 'queryLeagues');

export const actionChangeLeague = action(async (uuid: string) => {
  const league = await trpcClient.admin.changeLeague$.mutate({ uuid });

  if (league === null) {
    return json({ ok: false, message: 'League not found' } as const);
  }

  return json({ ok: true, data: league } as const, {
    revalidate: ['queryActiveLeague'],
  });
}, 'actionChangeLeague');

export const actionCreateLeague = action(async (league: LeagueCreate) => {
  const newLeague = await trpcClient.admin.createLeague.mutate(league);

  return json(newLeague, {
    revalidate: ['queryLeagues'],
  });
}, 'actionCreateLeague');

export const queryLeagueLink = query(async (uuid: string) => {
  const resp = await trpcClient.admin.leagueLink.query({ uuid });

  return resp.link;
}, 'queryLeagueLink');
