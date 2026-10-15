import type { Accessor } from 'solid-js';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryActiveLeague } from '#flib/trpcCalls';

export function useLeagueTimeZone(): Accessor<string | undefined> {
  const league = createResilientAsync(queryActiveLeague);

  return () => league.latest?.timezone;
}
