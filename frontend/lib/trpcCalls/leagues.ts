import { query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';

export const queryActiveLeague = query(async () => {
  return await trpcClient.leagues.activeLeague.query();
}, 'queryActiveLeague');
