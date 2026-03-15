import { prettifyError } from 'zod';
import {
  type Match,
  MatchCreate,
  type MatchWithoutMetadata,
  NormalizedTeamName,
} from '#shared/types/Sheets';
import { getValueHash } from '#shared/utils';

export function getMatchHash(
  match: Match | MatchWithoutMetadata | MatchCreate,
): string {
  const normalizedMatch = MatchCreate.safeEncode(match);

  if (!normalizedMatch.success) {
    throw new Error(
      `Invalid match data provided for hashing: ${prettifyError(
        normalizedMatch.error,
      )}`,
    );
  }

  return getValueHash(normalizedMatch.data);
}

export function normalizeTeamName(team: string): NormalizedTeamName {
  return NormalizedTeamName.parse(team);
}
