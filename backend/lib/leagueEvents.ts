import type { DB } from '#backend/db/database';
import { ActiveMatchModel } from '#backend/db/models/ActiveMatchModel';
import { StatsModel } from '#backend/db/models/StatsModel';
import { type Permission, PermissionEnum } from '#shared/permissions';
import type {
  LeagueEvent,
  LeagueEventTopic,
} from '#shared/types/api/leagueEvent';

type LeagueEventListener = (event: LeagueEvent) => void;

type LeagueEventSnapshot = (db: DB, leagueUuid: string) => Promise<LeagueEvent>;

export const LeagueEventTopicPermissions: Record<
  LeagueEventTopic,
  Permission[]
> = {
  STATS: [PermissionEnum.STATS_READ],
  ACTIVE_MATCHES: [PermissionEnum.MATCHES_READ],
};

const leagueEventSnapshots: Record<LeagueEventTopic, LeagueEventSnapshot> = {
  STATS: async (db, leagueUuid) => ({
    topic: 'STATS',
    version: await StatsModel.getVersion(db, leagueUuid),
  }),
  ACTIVE_MATCHES: async (db, leagueUuid) => ({
    topic: 'ACTIVE_MATCHES',
    matches: await ActiveMatchModel.getAll(db, leagueUuid),
  }),
};

const listeners = new Map<string, Set<LeagueEventListener>>();

export function publishLeagueEvent(
  leagueUuid: string,
  event: LeagueEvent,
): void {
  for (const listener of listeners.get(leagueUuid) ?? []) listener(event);
}

export function subscribeLeagueEvents(
  leagueUuid: string,
  listener: LeagueEventListener,
): () => void {
  const leagueListeners = listeners.getOrInsertComputed(
    leagueUuid,
    () => new Set(),
  );

  leagueListeners.add(listener);

  return () => {
    leagueListeners.delete(listener);

    if (leagueListeners.size === 0) listeners.delete(leagueUuid);
  };
}

export async function* streamLeagueEvents(
  db: DB,
  leagueUuid: string,
  topics: LeagueEventTopic[],
  signal: AbortSignal | undefined,
): AsyncGenerator<LeagueEvent> {
  const pending = new Map<LeagueEventTopic, LeagueEvent>();

  let wake: (() => void) | null = null;

  const unsubscribe = subscribeLeagueEvents(leagueUuid, (event) => {
    if (!topics.includes(event.topic)) return;

    pending.set(event.topic, event);
    wake?.();
  });
  const handleAbort = () => wake?.();

  signal?.addEventListener('abort', handleAbort);

  try {
    for (const topic of topics) {
      yield await leagueEventSnapshots[topic](db, leagueUuid);
    }

    while (!signal?.aborted) {
      if (pending.size === 0) {
        await new Promise<void>((resolve) => {
          wake = resolve;
        });
      }

      wake = null;

      const events = [...pending.values()];

      pending.clear();

      for (const event of events) yield event;
    }
  } finally {
    unsubscribe();
    signal?.removeEventListener('abort', handleAbort);
  }
}
