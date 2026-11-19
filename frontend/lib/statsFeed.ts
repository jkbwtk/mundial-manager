import { createAsync, revalidate } from '@solidjs/router';
import { onCleanup, onMount } from 'solid-js';
import { onLeagueEvent } from '#flib/leagueEvents';
import { queryStatsVersion, StatsQueryKeys } from '#flib/trpcCalls';
import type { StatsVersion } from '#shared/types/api/stats';

const STATS_REVALIDATE_DELAY_MS = 1000;

let subscribers = 0;
let timeoutRef: ReturnType<typeof setTimeout> | undefined;

export function useStatsFeed(): void {
  const version = createAsync(() => queryStatsVersion());

  const handleStatsUpdate = (next: StatsVersion) => {
    if (next === version.latest) return;

    clearTimeout(timeoutRef);
    timeoutRef = setTimeout(
      () => revalidate(StatsQueryKeys),
      STATS_REVALIDATE_DELAY_MS,
    );
  };

  onMount(() => {
    subscribers += 1;
    onLeagueEvent('STATS', (event) => handleStatsUpdate(event.version));

    onCleanup(() => {
      subscribers -= 1;

      if (subscribers === 0) clearTimeout(timeoutRef);
    });
  });
}
