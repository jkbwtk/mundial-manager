import { prettifyError } from 'zod';
import {
  type Match,
  MatchCreate,
  type MatchEvent,
  type MatchEventBallOut,
  type MatchEventGoal,
  type MatchEventPositionChange,
  type MatchEventType,
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

function filterEventsByType(
  match: Match,
  type: MatchEventType,
): MatchEvent[] | null {
  if (!match.replayMetadata?.events) {
    return null;
  }

  return match.replayMetadata.events.filter((ev) => ev.type === type);
}

export function getGoalEvents(match: Match): MatchEventGoal[] | null {
  return filterEventsByType(match, 'GOAL') as MatchEventGoal[] | null;
}

export function getBallOutEvents(match: Match): MatchEventBallOut[] | null {
  return filterEventsByType(match, 'BALL_OUT') as MatchEventBallOut[] | null;
}

export function getPositionChangeEvents(
  match: Match,
): MatchEventPositionChange[] | null {
  return filterEventsByType(match, 'POSITION_CHANGE') as
    | MatchEventPositionChange[]
    | null;
}

export function getOwnGoalEvents(
  match: Match,
  player?: string,
): MatchEventGoal[] | null {
  const goals = filterEventsByType(match, 'GOAL') as MatchEventGoal[] | null;

  if (goals === null) {
    return null;
  }

  const ownGoals = goals.filter((ev) => ev.for !== ev.by);

  if (player) {
    return ownGoals.filter((ev) => ev.player === player);
  }

  return ownGoals;
}

export const COLOR_PAIRS: [string, string][] = [
  ['Niebieski', 'Czerwony2'],
  ['Zielony', 'Czerwony3'],
];

export function getTeamColors(match: MatchCreate | Match): [string, string] {
  for (const colors of COLOR_PAIRS) {
    if (colors.includes(match.winningColor)) {
      const team1Won = match.score1 > match.score2;
      const winningColorIsFirst = match.winningColor === colors[0];

      return team1Won === winningColorIsFirst
        ? [colors[0], colors[1]]
        : [colors[1], colors[0]];
    }
  }

  return ['unknown', 'unknown'];
}
