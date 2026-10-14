import { createMemo, For, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  createMatchEvent,
  formatElapsed,
  MatchEventTypeLabels,
  MatchEventTypeSymbols,
} from '#flib/matchEvents';
import type { MatchEventType, MatchSide } from '#shared/types/api/matchEvent';
import { useMatchTimelineEditor } from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';

interface QuickAddEntry {
  type: MatchEventType;
  side?: MatchSide;
}

const QuickAddEntries: QuickAddEntry[] = [
  { type: 'GOAL', side: 'SIDE_1' },
  { type: 'GOAL', side: 'SIDE_2' },
  { type: 'BALL_OUT' },
  { type: 'POSITION_CHANGE', side: 'SIDE_1' },
  { type: 'POSITION_CHANGE', side: 'SIDE_2' },
  { type: 'PAUSE' },
  { type: 'EQUIPMENT_FAILURE' },
  { type: 'BALL_CHANGE' },
  { type: 'CANCEL' },
];

export const MatchEventQuickAdd: Component = () => {
  const [draft, lookup] = useMatchTimelineEditor();

  const insertOffset = createMemo(() => draft.getInsertOffset());

  const getEntryType = (entry: QuickAddEntry): MatchEventType =>
    entry.type === 'PAUSE' && draft.isPausedAt(insertOffset())
      ? 'RESUME'
      : entry.type;

  const addEvent = (entry: QuickAddEntry) => {
    draft.addEvent(
      createMatchEvent(
        getEntryType(entry),
        insertOffset(),
        lookup.timeline().match,
        entry.side,
      ),
    );
  };

  return (
    <div class={style.quickAdd}>
      <span class={style.dimmed}>
        Add at{' '}
        <Show when={insertOffset() !== 0} fallback="match start">
          T+{formatElapsed(insertOffset())}
        </Show>
        :
      </span>

      <div class={style.buttonRow}>
        <For each={QuickAddEntries}>
          {(entry) => (
            <Button
              severity="secondary"
              padding={0}
              onClick={() => addEvent(entry)}
            >
              <MaterialSymbol
                symbol={MatchEventTypeSymbols[getEntryType(entry)]}
              />{' '}
              {MatchEventTypeLabels[getEntryType(entry)]}
              <Show when={entry.side}>
                {(side) => (
                  <>
                    {' '}
                    <ColorBlock color={lookup.getSideColor(side())} width={2} />
                  </>
                )}
              </Show>
            </Button>
          )}
        </For>
      </div>
    </div>
  );
};
