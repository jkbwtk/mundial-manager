import { getExactStartDate } from '#shared/matchLabels';
import { getMatchTimelineSteps } from '#shared/matchTimeline';
import { getStatsMatchEnd, getStatsMatchSpan } from '#shared/stats/buckets';
import type { MatchEventPause } from '#shared/types/api/matchEvent';
import type { StatsBucketMatch } from '#shared/types/stats/bucket';
import type { StatsMatch } from '#shared/types/stats/statsRow';

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
