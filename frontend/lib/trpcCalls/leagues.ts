import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  League,
  LeagueNullable,
  type LeagueSettingsUpdate,
} from '#shared/types/api/league';

export const queryActiveLeague = query(async () => {
  const league = await trpcClient.leagues.activeLeague.query();

  return LeagueNullable.parse(league);
}, 'queryActiveLeague');

export const actionUpdateActiveLeague = action(
  async (league: LeagueSettingsUpdate) => {
    const updatedLeague = await trpcClient.leagues.updateActive.mutate(league);

    return json(League.parse(updatedLeague), {
      revalidate: ['queryActiveLeague', 'queryLeagues'],
    });
  },
  'actionUpdateActiveLeague',
);
