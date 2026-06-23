import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import type { BallQueryMeta } from '#shared/types/api/ball';
import {
  MatchEvent,
  type MatchEventByMatchId,
  type MatchEventCreate,
  type MatchEventUpdate,
} from '#shared/types/api/matchEvent';
import { PaginatedResponse } from '#shared/zod';

export const queryMatchEvents = query(async (meta: BallQueryMeta = {}) => {
  const matchEvents = await trpcClient.matchEvents.getAll.query(meta);

  return PaginatedResponse(MatchEvent).parse(matchEvents);
}, 'queryMatchEvents');

export const queryMatchEventsByMatchId = query(
  async (query: MatchEventByMatchId) => {
    const matchEvents = await trpcClient.matchEvents.getByMatchId.query(query);

    return PaginatedResponse(MatchEvent).parse(matchEvents);
  },
  'queryMatchEventsByMatchId',
);

export const queryMatchEventById = query(async (uuid: string) => {
  const matchEvent = await trpcClient.matchEvents.getById.query({ uuid });

  return MatchEvent.parse(matchEvent);
}, 'queryMatchEventById');

export const actionCreateMatchEvent = action(
  async (matchEvent: MatchEventCreate) => {
    const newMatchEvent =
      await trpcClient.matchEvents.create.mutate(matchEvent);

    return json(MatchEvent.parse(newMatchEvent), {
      revalidate: ['queryMatchEvents', 'queryMatchEventsByMatchId'],
    });
  },
  'actionCreateMatchEvent',
);

export const actionUpdateMatchEvent = action(
  async (matchEvent: MatchEventUpdate) => {
    const updatedMatchEvent =
      await trpcClient.matchEvents.update.mutate(matchEvent);

    return json(MatchEvent.parse(updatedMatchEvent), {
      revalidate: [
        'queryMatchEvents',
        'queryMatchEventsByMatchId',
        'queryMatchEventById',
      ],
    });
  },
  'actionUpdateMatchEvent',
);

export const actionDeleteMatchEvent = action(async (uuid: string) => {
  const deletedMatchEvent = await trpcClient.matchEvents.delete.mutate({
    uuid,
  });

  return json(MatchEvent.parse(deletedMatchEvent), {
    revalidate: [
      'queryMatchEvents',
      'queryMatchEventsByMatchId',
      'queryMatchEventById',
    ],
  });
}, 'actionDeleteMatchEvent');
