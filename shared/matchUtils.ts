import { prettifyError } from 'zod';
import {
  type Match,
  MatchCreate,
  type MatchEvent,
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

export function getPauseDuration(events: MatchEvent[]): number {
  let paused: number | null = null;
  let pauseDuration = 0;

  for (const event of events) {
    if (event.type === 'PAUSE' && paused === null) {
      paused = event.time;
    }

    if (event.type === 'RESUME' && paused !== null) {
      pauseDuration += event.time - paused;
      paused = null;
    }
  }

  return pauseDuration;
}

export function hasBeenCancelled(events?: MatchEvent[] | null): boolean {
  if (Array.isArray(events) === false) {
    return false;
  }

  return events.at(-1)?.type === 'CANCEL';
}

export function hasWon(
  match: Match,
  team: keyof Pick<Match, 'team1' | 'team2'>,
): boolean {
  if (hasBeenCancelled(match.replayMetadata?.events)) {
    return false;
  }

  if (match.score1 === match.score2) {
    return false;
  }

  if (team === 'team1') {
    return match.score1 > match.score2;
  }

  return match.score2 > match.score1;
}
