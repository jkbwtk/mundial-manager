import { onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { onReconnect } from '#flib/network';
import { trpcClient } from '#flib/trpcClient';
import {
  LeagueEvent,
  type LeagueEventTopic,
} from '#shared/types/api/leagueEvent';

type LeagueEventHandler<Topic extends LeagueEventTopic> = (
  event: Extract<LeagueEvent, { topic: Topic }>,
) => void;

const handlers = new Map<LeagueEventTopic, Set<(event: LeagueEvent) => void>>();

let subscription: { unsubscribe: () => void } | null = null;
let subscribedTopics = '';
let isSyncScheduled = false;

function getActiveTopics(): LeagueEventTopic[] {
  if (document.visibilityState !== 'visible') return [];

  return [...handlers.keys()].toSorted();
}

function dispatchLeagueEvent(event: LeagueEvent): void {
  for (const handler of handlers.get(event.topic) ?? []) handler(event);
}

function syncSubscription(force = false): void {
  isSyncScheduled = false;

  const topics = getActiveTopics();
  const key = topics.join(',');

  if (!force && key === subscribedTopics) return;

  subscription?.unsubscribe();
  subscription = null;
  subscribedTopics = key;

  if (topics.length === 0) return;

  subscription = trpcClient.events.onLeagueEvent.subscribe(
    { topics },
    {
      onData: (data) => dispatchLeagueEvent(LeagueEvent.parse(data)),
      onError: (err) => {
        console.error('League event stream error:', err);
      },
    },
  );
}

function scheduleSync(): void {
  if (isSyncScheduled) return;

  isSyncScheduled = true;
  queueMicrotask(() => syncSubscription());
}

if (!isServer) {
  document.addEventListener('visibilitychange', scheduleSync);

  onReconnect(() => syncSubscription(true));
}

export function onLeagueEvent<Topic extends LeagueEventTopic>(
  topic: Topic,
  handler: LeagueEventHandler<Topic>,
): void {
  if (isServer) return;

  const topicHandlers = handlers.getOrInsertComputed(topic, () => new Set());
  const registered = (event: LeagueEvent) =>
    handler(event as Extract<LeagueEvent, { topic: Topic }>);

  topicHandlers.add(registered);
  scheduleSync();

  onCleanup(() => {
    topicHandlers.delete(registered);

    if (topicHandlers.size === 0) handlers.delete(topic);

    scheduleSync();
  });
}
