import { query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import { ActiveMatches } from '#shared/types/api/activeMatch';

export const queryActiveMatches = query(async () => {
  const activeMatches = await trpcClient.activeMatches.getAll.query();

  return ActiveMatches.parse(activeMatches);
}, 'queryActiveMatches');
