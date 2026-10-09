import type { Match } from '#shared/types/api/match';

type PlayedMatch = Pick<Match, 'playersSide1' | 'playersSide2'>;

export function getMatchPlayerUuids(match: PlayedMatch): string[] {
  return [...match.playersSide1, ...match.playersSide2];
}

export function isMatchPlayer(match: PlayedMatch, playerUuid: string): boolean {
  return getMatchPlayerUuids(match).includes(playerUuid);
}
