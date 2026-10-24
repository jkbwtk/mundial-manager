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
  type MatchImport as LegacyMatchImport,
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

export const queryMatchesBySyncIds = query(async (syncIds: string[]) => {
  const matches = await trpcClient.matches.getBySyncIds.query({ syncIds });

  return Match.array().parse(matches);
}, 'queryMatchesBySyncIds');

export const actionCreateMatch = action(async (match: MatchCreate) => {
  const newMatch = await trpcClient.matches.create.mutate(match);

  return json(Match.parse(newMatch), {
    revalidate: ['queryMatches', 'queryActiveMatches'],
  });
}, 'actionCreateMatch');

export const actionCreateMatchWithWebhook = action(
  async (match: MatchCreate) => {
    const newMatch = await trpcClient.matches.createWithWebhook.mutate(match);

    return json(Match.parse(newMatch), {
      revalidate: ['queryMatches', 'queryActiveMatches'],
    });
  },
  'actionCreateMatchWithWebhook',
);

export const actionCreateFullMatch = action(
  async (fullMatch: MatchFullCreate) => {
    const newMatch = await trpcClient.matches.createFull.mutate(fullMatch);

    return json(Match.parse(newMatch), {
      revalidate: ['queryMatches', 'queryActiveMatches'],
    });
  },
  'actionCreateFullMatch',
);

export const actionUpdateMatch = action(async (match: MatchUpdate) => {
  const updatedMatch = await trpcClient.matches.update.mutate(match);

  return json(Match.parse(updatedMatch), {
    revalidate: [
      'queryMatches',
      'queryActiveMatches',
      'queryMatchById',
      'queryMatchTimeline',
    ],
  });
}, 'actionUpdateMatch');

export const actionUpdateMatchWithWebhook = action(
  async (match: MatchUpdate) => {
    const updatedMatch = await trpcClient.matches.update.mutate(match);

    return json(Match.parse(updatedMatch), {
      revalidate: [
        'queryMatches',
        'queryActiveMatches',
        'queryMatchById',
        'queryMatchTimeline',
      ],
    });
  },
  'actionUpdateMatchWithWebhook',
);

export const actionDeleteMatch = action(async (uuid: string) => {
  const deletedMatch = await trpcClient.matches.delete.mutate({ uuid });

  return json(Match.parse(deletedMatch), {
    revalidate: [
      'queryMatches',
      'queryActiveMatches',
      'queryMatchById',
      'queryMatchTimeline',
    ],
  });
}, 'actionDeleteMatch');

export const actionImportLegacyMatch = action(
  async (legacyImport: LegacyMatchImport) => {
    const newMatch = await trpcClient.matches.importLegacy.mutate(
      legacyImport.row,
    );

    return json(Match.parse(newMatch), {
      revalidate: ['queryMatches', 'queryActiveMatches'],
    });
  },
  'actionImportLegacyMatch',
);

export const actionCreateLegacyMatch = action(
  async (match: LegacyMatchCreate, syncId: string | null = null) => {
    const newMatch = await trpcClient.matches.createLegacy.mutate({
      match,
      syncId,
    });

    return json(LegacyMatch.parse(newMatch), {
      revalidate: [
        'queryMatches',
        'queryActiveMatches',
        'queryMatchById',
        'queryMatchesBySyncIds',
      ],
    });
  },
  'actionCreateLegacyMatch',
);
