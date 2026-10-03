import { createMemo, type JSX, Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import { KeyedFor } from '#components/KeyedFor';
import { createListReorder } from '#flib/listReorder';
import {
  getMatchTimelineDraftSteps,
  type MatchTimelineDraft,
} from '#flib/matchTimelineDraft';
import { createMatchTimelineLookup } from '#flib/matchTimelineLookup';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';
import { MatchTimelineRow } from './MatchTimelineRow';
import style from './MatchTimelineTable.module.scss';

export interface MatchTimelineTableProps {
  timeline: MatchTimeline;
  draft?: MatchTimelineDraft;

  renderInspector?: (uuid: string) => JSX.Element;
}

export const MatchTimelineTable: Component<MatchTimelineTableProps> = (
  props,
) => {
  const lookup = createMatchTimelineLookup(() => props.timeline);
  const reorder = createListReorder({
    onMove: (uuid, index) => props.draft?.moveEvent(uuid, index),
    onGrab: (uuid) => props.draft?.setSelectedUuid(uuid),
  });

  const steps = createMemo(
    () =>
      props.draft?.steps() ?? getMatchTimelineDraftSteps(props.timeline.events),
  );

  const isEditable = () => props.draft !== undefined;
  const hasIssues = () => (props.draft?.issues().length ?? 0) > 0;

  return (
    <Show
      when={isEditable() || steps().length > 0}
      fallback={
        <div class={style.noData}>
          No timeline data available for this match.
        </div>
      }
    >
      <div
        classList={{
          [style.table]: true,
          [style.editable]: isEditable(),
          [style.issues]: hasIssues(),
        }}
      >
        <div
          classList={{
            [style.row]: true,
            [style.header]: true,
          }}
        >
          <Show when={isEditable()}>
            <span />
          </Show>

          <span class={style.time}>T+</span>

          <span class={style.lane}>
            <ColorBlock color={lookup.getSideColor('SIDE_1')} width={2} />
          </span>

          <span />

          <span class={style.lane}>
            <ColorBlock color={lookup.getSideColor('SIDE_2')} width={2} />
          </span>

          <span class={style.description}>Description</span>

          <span>Score</span>

          <Show when={hasIssues()}>
            <span />
          </Show>
        </div>

        <Show
          when={steps().length > 0}
          fallback={
            <span class={style.hint}>
              No events yet, add the first one with the buttons above.
            </span>
          }
        >
          <KeyedFor each={steps()} by={(step) => step.event.uuid}>
            {(step, uuid) => (
              <>
                <MatchTimelineRow
                  step={step()}
                  lookup={lookup}
                  reorder={reorder}
                  draft={props.draft}
                  issueColumn={hasIssues()}
                />

                <Show
                  when={props.draft?.isSelected(uuid) && props.renderInspector}
                >
                  {(renderInspector) => (
                    <div class={style.inspector}>{renderInspector()(uuid)}</div>
                  )}
                </Show>
              </>
            )}
          </KeyedFor>
        </Show>
      </div>
    </Show>
  );
};
