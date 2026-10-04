import { Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import { MatchEventSymbol } from '#components/MatchTimelineTable';
import {
  formatElapsed,
  getMatchEventLane,
  MatchEventTypeLabels,
} from '#flib/matchEvents';
import type { PointerDragHandlers } from '#flib/pointerDrag';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import type { MatchTimelineIssueSeverity } from '#shared/types/api/matchTimeline';
import variables from '#styles/variables.module.scss';
import { useMatchTimelineEditor } from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';

export interface MatchEventMarkerProps {
  event: MatchEvent;
  position: number; // percent of the track width

  onPointerDown: (ev: PointerEvent) => void;
  dragHandlers: PointerDragHandlers;

  grabbed: boolean;
  dragged: boolean;
}

const SeverityColors: Record<MatchTimelineIssueSeverity, string> = {
  ERROR: variables.redBright,
  WARNING: variables.yellowBright,
};

export const MatchEventMarker: Component<MatchEventMarkerProps> = (props) => {
  const [draft] = useMatchTimelineEditor();

  const uuid = () => props.event.uuid;
  const lane = () => getMatchEventLane(props.event);
  const severity = () => draft.getEventSeverity(uuid());

  const label = () =>
    `${MatchEventTypeLabels[props.event.type]} T+${formatElapsed(props.event.offset)}`;

  return (
    <button
      type="button"
      classList={{
        [style.marker]: true,
        [style.side1]: lane() === 'SIDE_1',
        [style.side2]: lane() === 'SIDE_2',
        [style.neutral]: lane() === null,
        [style.selected]: draft.isSelected(uuid()),
        [style.grabbed]: props.grabbed,
      }}
      style={{ '--position': props.position }}
      title={label()}
      aria-label={label()}
      {...props.dragHandlers}
      onPointerDown={(ev) => props.onPointerDown(ev)}
      onClick={(ev) => ev.stopPropagation()}
      onFocus={() => draft.setSelectedUuid(uuid())}
    >
      <MatchEventSymbol event={props.event} />

      <Show when={severity()}>
        {(currentSeverity) => (
          <span class={style.markerIssue}>
            <ColorBlock fill color={SeverityColors[currentSeverity()]} />
          </span>
        )}
      </Show>

      <Show when={props.dragged}>
        <span class={style.dragLabel}>
          T+{formatElapsed(props.event.offset)}
        </span>
      </Show>
    </button>
  );
};
