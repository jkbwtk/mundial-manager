import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  MatchSession,
  type MatchSessionSpectatorsSave,
} from '#shared/types/api/matchSession';

export const queryMatchSession = query(async (matchUuid: string) => {
  const session = await trpcClient.matchSessions.getByMatchId.query({
    matchUuid,
  });

  return MatchSession.parse(session);
}, 'queryMatchSession');

export const actionSaveMatchSessionSpectators = action(
  async (data: MatchSessionSpectatorsSave) => {
    const session = await trpcClient.matchSessions.saveSpectators.mutate(data);

    return json(MatchSession.parse(session), {
      revalidate: [
        'queryMatchSession',
        'queryMatches',
        'queryMatchById',
        'queryMatchTimeline',
      ],
    });
  },
  'actionSaveMatchSessionSpectators',
);
