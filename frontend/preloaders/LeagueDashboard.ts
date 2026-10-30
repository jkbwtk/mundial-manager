import { queryActiveLeague, queryGoalTypes } from '#flib/trpcCalls';

export function preloadLeagueDashboard() {
  queryActiveLeague();
  queryGoalTypes();
}
