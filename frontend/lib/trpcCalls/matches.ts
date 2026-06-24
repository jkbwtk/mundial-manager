import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Match,
  type MatchCreate,
  type MatchFullCreate,
  type MatchQueryMeta,
  type MatchUpdate,
} from '#shared/types/api/match';
import { PaginatedResponse } from '#shared/zod';

export const queryMatches = query(async (meta: MatchQueryMeta = {}) => {
  const matches = await trpcClient.matches.getAll.query(meta);

  return PaginatedResponse(Match).parse(matches);
}, 'queryMatches');

export const queryMatchById = query(async (uuid: string) => {
  const match = await trpcClient.matches.getById.query({ uuid });

  return Match.parse(match);
}, 'queryMatchById');

export const actionCreateMatch = action(async (match: MatchCreate) => {
  const newMatch = await trpcClient.matches.create.mutate(match);

  return json(Match.parse(newMatch), {
    revalidate: ['queryMatches'],
  });
}, 'actionCreateMatch');

export const actionCreateFullMatch = action(
  async (fullMatch: MatchFullCreate) => {
    const newMatch = await trpcClient.matches.createFullMatch.mutate(fullMatch);

    return json(Match.parse(newMatch), {
      revalidate: ['queryMatches'],
    });
  },
  'actionCreateFullMatch',
);

export const actionUpdateMatch = action(async (match: MatchUpdate) => {
  const updatedMatch = await trpcClient.matches.update.mutate(match);

  return json(Match.parse(updatedMatch), {
    revalidate: ['queryMatches', 'queryMatchById'],
  });
}, 'actionUpdateMatch');

export const actionDeleteMatch = action(async (uuid: string) => {
  const deletedMatch = await trpcClient.matches.delete.mutate({ uuid });

  return json(Match.parse(deletedMatch), {
    revalidate: ['queryMatches', 'queryMatchById'],
  });
}, 'actionDeleteMatch');
