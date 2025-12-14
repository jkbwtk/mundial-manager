import crypto from 'crypto-js';
import stableHash from 'stable-hash';
import { prettifyError } from 'zod';
import {
  type Match,
  MatchCreate,
  type MatchWithoutMetadata,
  NormalizedTeamName,
} from '#shared/types/Sheets';

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

  const preHash = stableHash(normalizedMatch.data);
  const hash = crypto.SHA256(preHash).toString();

  return hash;
}

export function normalizeTeamName(team: string): NormalizedTeamName {
  return NormalizedTeamName.parse(team);
}
