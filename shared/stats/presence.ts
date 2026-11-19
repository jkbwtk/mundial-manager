import { getExactStartDate } from '#shared/matchLabels';
import { getMatchTimelineSteps } from '#shared/matchTimeline';
import { getStatsMatchEnd, getStatsMatchSpan } from '#shared/stats/buckets';
import type { MatchEventPause } from '#shared/types/api/matchEvent';
import type { PlayerPresenceSession } from '#shared/types/api/stats';
import type { StatsBucketMatch } from '#shared/types/stats/bucket';
import type { StatsMatch, StatsRow } from '#shared/types/stats/statsRow';

export function getStatsSessionSpan(
  matches: StatsBucketMatch[],
): [start: number, end: number] | null {
  const starts = matches.flatMap(
    (match) => getExactStartDate(match)?.getTime() ?? [],
  );
  const ends = matches.flatMap((match) => getStatsMatchEnd(match) ?? []);

  if (starts.length === 0 || ends.length === 0) return null;

  return [Math.min(...starts), Math.max(...ends)];
}

export function getStatsPresenceIncrement(
  match: StatsBucketMatch,
  previousEnd: number | null,
): number {
  const end = getStatsMatchEnd(match);

  if (end === null || previousEnd === null) return getStatsMatchSpan(match);

  return Math.max(getStatsMatchSpan(match), end - previousEnd);
}

export function getStatsPauseAbsence(
  match: Pick<StatsMatch, 'pauseDuration' | 'events'>,
): number {
  let pause: MatchEventPause | null = null;
  let present = 0;

  for (const { event, pausedBefore, pausedAfter } of getMatchTimelineSteps(
    match.events,
  )) {
    if (event.type === 'PAUSE' && !pausedBefore) pause = event;

    if (pause !== null && pausedBefore && !pausedAfter) {
      if (pause.countsAsPresence) present += event.offset - pause.offset;

      pause = null;
    }
  }

  return match.pauseDuration - present;
}

export function calculatePlayerPresenceSessions(
  rows: StatsRow[],
  playerUuid: string,
): PlayerPresenceSession[] {
  const sessions = new Map<string, PlayerPresenceSession>();

  for (const row of rows) {
    const player = row.players.find((entry) => entry.uuid === playerUuid);
    const { startDate } = row.match;

    if (
      player === undefined ||
      row.sessionKey === null ||
      row.day === null ||
      startDate === null
    ) {
      continue;
    }

    const session = sessions.get(row.sessionKey) ?? {
      day: row.day,
      matchUuid: row.match.uuid,

      startDate,
      endDate: startDate,

      playingTime: 0,
      spectatingTime: 0,

      matches: 0,
      spectatedMatches: 0,
    };

    session.endDate = new Date(
      startDate.getTime() + getStatsMatchSpan(row.match),
    );

    if (player.side === null) {
      session.spectatingTime += player.presence;
      session.spectatedMatches += 1;
    } else {
      session.playingTime += player.presence;
      session.matches += 1;
    }

    sessions.set(row.sessionKey, session);
  }

  return [...sessions.values()];
}
