import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from 'solid-js';
import { onLeagueEvent } from '#flib/leagueEvents';
import { createResilientAsync, ResilientSkip } from '#flib/resilientAsync';
import { queryActiveMatches, queryMatchPrediction } from '#flib/trpcCalls';
import { getExactStartDate, getKnownStartDate } from '#shared/matchLabels';
import { getStatsDayKey } from '#shared/stats/buckets';
import { getLiveMatchPrediction } from '#shared/stats/matchPrediction';
import { DAY_MS, formatDate, formatTime } from '#shared/timeUtils';
import type { ActiveMatch } from '#shared/types/api/activeMatch';
import type {
  MatchPrediction,
  MatchPredictionQuery,
} from '#shared/types/api/stats';
import type { LiveMatchPrediction } from '#shared/types/MundialCalculator';

export interface UpcomingMatch {
  active: ActiveMatch;
  day: string | null; // YYYY-MM-DD in the league time zone
  overdue: boolean;
}

export const ACTIVE_MATCH_STALE_MS = 10 * 60_000;
export const UPCOMING_MATCH_DAYS = 7;
export const WIN_CHANCES_TITLE = 'Win chance, side 1 / side 2';
export const UPCOMING_MATCHES_HREF =
  '/matches?filters.status=SCHEDULED&filters.status=PAUSED';

export function getSortedLineup(
  lineup: MatchPredictionQuery,
): MatchPredictionQuery {
  return {
    playersSide1: lineup.playersSide1.toSorted(),
    playersSide2: lineup.playersSide2.toSorted(),
  };
}

export function useActiveMatches(): Accessor<ActiveMatch[]> {
  const initial = createResilientAsync(queryActiveMatches);
  const [pushed, setPushed] = createSignal<ActiveMatch[] | null>(null);

  createEffect(
    on(
      () => initial.latest,
      () => setPushed(null),
      { defer: true },
    ),
  );

  onMount(() => {
    onLeagueEvent('ACTIVE_MATCHES', (event) => setPushed(event.matches));
  });

  return () => pushed() ?? initial.latest ?? [];
}

export function isActiveMatchStale(active: ActiveMatch, now: number): boolean {
  return (
    active.match.status !== 'SCHEDULED' &&
    now - active.updatedAt.getTime() > ACTIVE_MATCH_STALE_MS
  );
}

export function getUpcomingMatches(
  matches: ActiveMatch[],
  timeZone: string,
  now: number,
): UpcomingMatch[] {
  const today = getStatsDayKey(new Date(now), timeZone);
  const lastDay = getStatsDayKey(
    new Date(now + (UPCOMING_MATCH_DAYS - 1) * DAY_MS),
    timeZone,
  );

  const paused = matches.flatMap((active) =>
    active.match.status === 'PAUSED'
      ? [{ active, day: null, overdue: false }]
      : [],
  );
  const scheduled = matches.flatMap((active): UpcomingMatch[] => {
    if (active.match.status !== 'SCHEDULED') return [];

    const startDate = getKnownStartDate(active.match);
    const day = startDate && getStatsDayKey(startDate, timeZone);

    if (day !== null && day > lastDay) return [];

    return [{ active, day, overdue: day !== null && day < today }];
  });

  return [
    ...paused,
    ...scheduled.filter((upcoming) => upcoming.overdue),
    ...scheduled.filter((upcoming) => !upcoming.overdue),
  ];
}

export function formatWinChances(probability: number): string {
  const side1 = Math.round(probability * 100);

  return `${side1}/${100 - side1}`;
}

export function formatUpcomingMatchTime(
  upcoming: UpcomingMatch,
  timeZone: string,
  now: number,
): string {
  const startDate = getExactStartDate(upcoming.active.match);
  const time = startDate === null ? null : formatTime(startDate, timeZone);

  if (upcoming.active.match.status === 'PAUSED') return 'paused';
  if (upcoming.day === null) return 'any day';
  if (upcoming.overdue) return upcoming.day;

  if (upcoming.day === getStatsDayKey(new Date(now), timeZone)) {
    return time ?? 'today';
  }

  if (upcoming.day === getStatsDayKey(new Date(now + DAY_MS), timeZone)) {
    return time === null ? 'tomorrow' : `tomorrow ${time}`;
  }

  const date = formatDate(
    startDate ?? getKnownStartDate(upcoming.active.match),
    timeZone,
  ).slice(5);

  return time === null ? date : `${date} ${time}`;
}

export function useLiveMatchPrediction(
  active: Accessor<ActiveMatch>,
  enabled: Accessor<boolean> = () => true,
  preMatch: Accessor<MatchPrediction | null> = () => null,
): Accessor<LiveMatchPrediction | null> {
  const lineup = () => getSortedLineup(active().match);
  const prediction = createResilientAsync(
    () => (enabled() ? lineup() : ResilientSkip),
    queryMatchPrediction,
  );

  return createMemo(() => {
    const current = enabled() ? prediction.latest : preMatch();

    if (!current) return null;

    return getLiveMatchPrediction(current, {
      ...lineup(),
      goals: active().events.flatMap((event) =>
        event.type === 'GOAL'
          ? [
              {
                player: event.player,
                side: event.side,
                ownGoal: event.ownGoal,
                goalType: event.goalType,
              },
            ]
          : [],
      ),
    });
  });
}
