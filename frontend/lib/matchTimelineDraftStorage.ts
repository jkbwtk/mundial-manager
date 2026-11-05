import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  on,
} from 'solid-js';
import z from 'zod';
import { createDraftStore, persistDraft } from '#flib/draftStorage';
import type { MatchTimelineDraft } from '#flib/matchTimelineDraft';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import type { MatchTimelineMatchChanges } from '#shared/types/api/matchTimeline';
import { getValueHash } from '#shared/utils';

export interface RestoredMatchTimelineDraft {
  savedAt: number;
  baseChanged: boolean;
}

export interface MatchTimelineDraftPersistence {
  restored: Accessor<RestoredMatchTimelineDraft | null>;
  writeFailed: Accessor<boolean>;

  dismissRestored: () => void;
  clear: () => void;
}

const StoredMatchEvents = z.array(
  z.looseObject({ uuid: z.string(), type: z.string(), offset: z.number() }),
) as unknown as z.ZodType<MatchEvent[]>;

const StoredMatchChanges = z.looseObject({
  startDate: z.coerce.date().nullable().optional(),
}) as unknown as z.ZodType<MatchTimelineMatchChanges>;

const StoredMatchTimelineDraftState = z.object({
  match: StoredMatchChanges,
  events: StoredMatchEvents,
});

const matchTimelineDrafts = createDraftStore(
  'matchTimeline',
  StoredMatchTimelineDraftState,
);

export function persistMatchTimelineDraft(
  matchUuid: Accessor<string>,
  draft: MatchTimelineDraft,
  loaded: Accessor<boolean>,
): MatchTimelineDraftPersistence {
  const [restored, setRestored] =
    createSignal<RestoredMatchTimelineDraft | null>(null);
  const [writeFailed, setWriteFailed] = createSignal(false);

  const base = () => getValueHash([draft.original(), draft.originalMatch()]);
  const storageKey = createMemo(() => (loaded() ? matchUuid() : null));

  createEffect(
    on(storageKey, (uuid) => {
      setRestored(null);

      if (uuid === null) return;

      const stored = matchTimelineDrafts.read(uuid);

      if (stored === null) return;

      if (draft.isCurrentState(stored.data)) return;

      draft.restore(stored.data);
      setRestored({
        savedAt: stored.savedAt,
        baseChanged: stored.base !== base(),
      });
    }),
  );

  const persistence = persistDraft({
    store: matchTimelineDrafts,
    key: storageKey,
    isDirty: draft.isDirty,
    base,
    snapshot: draft.state,
    onWrite: (isWritten) => setWriteFailed(!isWritten),
  });

  return {
    restored,
    writeFailed,

    dismissRestored: () => setRestored(null),
    clear: persistence.clear,
  };
}
