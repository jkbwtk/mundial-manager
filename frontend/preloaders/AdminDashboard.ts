import { queryActiveLeague, queryLeagues } from '#flib/trpcCalls';

export function preloadAdminDashboard() {
  queryLeagues();
  queryActiveLeague();
}
