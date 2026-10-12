import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import z from 'zod';
import { getPauseDuration, hasBeenCancelled } from '#shared/matchUtils';
import type { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import { MatchCreate, type MatchEvent } from '#shared/types/Sheets';
import { jsonCodec } from '#shared/zod';

export const LegacyLocalMatch = MatchCreate.extend({
  syncId: z.string(),
});
export type LegacyLocalMatch = z.infer<typeof LegacyLocalMatch>;

const LegacyOutbox = jsonCodec(LegacyLocalMatch.array());

const LEGACY_OUTBOX_STORAGE_KEY = 'createdMatches';

const [outbox, setOutbox] = createSignal<Record<string, LegacyLocalMatch>>({});

let isOutboxLoaded = false;

function readLegacyOutbox(): string {
  try {
    return localStorage.getItem(LEGACY_OUTBOX_STORAGE_KEY) ?? '[]';
  } catch (err) {
    console.error('Failed to read legacy outbox:', err);

    return '[]';
  }
}

function loadLegacyOutbox(): void {
  if (isServer || isOutboxLoaded) return;

  isOutboxLoaded = true;

  const stored = LegacyOutbox.safeDecode(readLegacyOutbox());

  if (!stored.success) return;

  setOutbox(
    Object.fromEntries(stored.data.map((match) => [match.syncId, match])),
  );
}

function saveLegacyOutbox(matches: Record<string, LegacyLocalMatch>): void {
  setOutbox(matches);

  if (isServer) return;

  try {
    localStorage.setItem(
      LEGACY_OUTBOX_STORAGE_KEY,
      LegacyOutbox.encode(Object.values(matches)),
    );
  } catch (err) {
    console.error('Failed to persist legacy outbox:', err);
  }
}

function getLastGoalEvent(events: MatchEvent[] | null): MatchEvent | null {
  return events?.findLast((event) => event.type === 'GOAL') ?? null;
}

function getCalculatorMatchDuration(
  event: Pick<CalculatorFinishEvent, 'events' | 'startedAt'>,
): number {
  const lastEvent = event.events?.at(-1);

  return lastEvent
    ? lastEvent.time - event.startedAt
    : Math.floor(Date.now() / 1000) - event.startedAt;
}

export function getLegacyOutbox(): Record<string, LegacyLocalMatch> {
  loadLegacyOutbox();

  return outbox();
}

export function addLegacyMatch(match: MatchCreate): LegacyLocalMatch {
  const local: LegacyLocalMatch = {
    ...match,
    syncId: `local:${crypto.randomUUID()}`,
  };

  saveLegacyOutbox({ ...getLegacyOutbox(), [local.syncId]: local });

  return local;
}

export function removeLegacyMatch(syncId: string): void {
  const { [syncId]: _removed, ...rest } = getLegacyOutbox();

  saveLegacyOutbox(rest);
}

export function clearLegacyMatches(): void {
  saveLegacyOutbox({});
}

export function convertCalculatorFinishEventToMatch(
  event: CalculatorFinishEvent,
): MatchCreate {
  const lastGoal = getLastGoalEvent(event.events);
  const lastHistoryGoal = event.history?.at(-1);

  const winningColor = hasBeenCancelled(event.events)
    ? 'unknown'
    : ((lastGoal?.type === 'GOAL' ? lastGoal.for : null) ??
      lastHistoryGoal ??
      'unknown');

  return {
    team1: event.teams[0].join(' '),
    team2: event.teams[1].join(' '),

    date: event.startedAt,

    score1: event.scores[0],
    score2: event.scores[1],

    winningColor,
    duration:
      getCalculatorMatchDuration(event) - getPauseDuration(event.events ?? []),

    replayMetadata: event.events
      ? {
          startedAt: event.startedAt,
          events: event.events,
        }
      : null,
  };
}
