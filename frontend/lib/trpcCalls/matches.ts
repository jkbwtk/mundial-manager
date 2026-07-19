import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Match,
  type MatchCreate,
  type MatchQueryMeta,
  type MatchUpdate,
} from '#shared/types/api/match';
import type { MatchFullCreate } from '#shared/types/api/matchFull';
import {
  Match as LegacyMatch,
  type MatchCreate as LegacyMatchCreate,
} from '#shared/types/Sheets';
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
    revalidate: ['queryMatches', 'queryLegacyMatches'],
  });
}, 'actionCreateMatch');

export const actionCreateFullMatch = action(
  async (fullMatch: MatchFullCreate) => {
    const newMatch = await trpcClient.matches.createFull.mutate(fullMatch);

    return json(Match.parse(newMatch), {
      revalidate: ['queryMatches', 'queryLegacyMatches'],
    });
  },
  'actionCreateFullMatch',
);

export const actionUpdateMatch = action(async (match: MatchUpdate) => {
  const updatedMatch = await trpcClient.matches.update.mutate(match);

  return json(Match.parse(updatedMatch), {
    revalidate: ['queryMatches', 'queryMatchById', 'queryLegacyMatches'],
  });
}, 'actionUpdateMatch');

export const actionDeleteMatch = action(async (uuid: string) => {
  const deletedMatch = await trpcClient.matches.delete.mutate({ uuid });

  return json(Match.parse(deletedMatch), {
    revalidate: ['queryMatches', 'queryMatchById', 'queryLegacyMatches'],
  });
}, 'actionDeleteMatch');

export const queryLegacyMatches = query(async () => {
  const matches = await trpcClient.matches.getLegacy.query();

  return LegacyMatch.array().parse(matches);
}, 'queryLegacyMatches');

export const actionCreateLegacyMatch = action(
  async (match: LegacyMatchCreate) => {
    const newMatch = await trpcClient.matches.createLegacy.mutate(match);

    return json(LegacyMatch.parse(newMatch), {
      revalidate: ['queryMatches', 'queryMatchById', 'queryLegacyMatches'],
    });
  },
  'actionCreateLegacyMatch',
);
