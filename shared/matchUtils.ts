import crypto from 'crypto-js';
import stableHash from 'stable-hash';
import { type Match, MatchCreate, MatchWithoutMetadata } from '#shared/types/Sheets';

export function getMatchHash(match: Match | MatchWithoutMetadata | MatchCreate): string {
  const strippedMatch = structuredClone(match);

  const allowedKeys = Object.keys(MatchCreate.shape);
  const matchKeys = Object.keys(match);

  for (const key of matchKeys) {
    if (allowedKeys.includes(key) === false) {
      // @ts-expect-error
      delete strippedMatch[key];
    }
  }

  const preHash = stableHash(strippedMatch);
  const hash = crypto.SHA256(preHash).toString();

  return hash;
}
