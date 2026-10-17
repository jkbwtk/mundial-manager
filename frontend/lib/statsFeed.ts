import { createAsync, revalidate } from '@solidjs/router';
import { onCleanup, onMount } from 'solid-js';
import { onLeagueEvent } from '#flib/leagueEvents';
import { queryStatsVersion, StatsQueryKeys } from '#flib/trpcCalls';
import type { StatsVersion } from '#shared/types/api/stats';

const STATS_REVALIDATE_DELAY_MS = 1000;

export function useStatsFeed(): void {
  const version = createAsync(() => queryStatsVersion());

  let timeoutRef: ReturnType<typeof setTimeout> | undefined;

  const handleStatsUpdate = (next: StatsVersion) => {
    if (next === version.latest) return;

    clearTimeout(timeoutRef);
    timeoutRef = setTimeout(
      () => revalidate(StatsQueryKeys),
      STATS_REVALIDATE_DELAY_MS,
    );
  };

  onMount(() => {
    onLeagueEvent('STATS', (event) => handleStatsUpdate(event.version));
  });

  onCleanup(() => clearTimeout(timeoutRef));
}
