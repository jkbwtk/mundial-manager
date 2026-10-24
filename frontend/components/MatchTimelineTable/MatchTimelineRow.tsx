import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  MaterialSymbol,
  type SymbolColorType,
} from '#components/MaterialSymbol';
import { TextMarquee } from '#components/TextMarquee';
import type { ListReorder } from '#flib/listReorder';
import { formatElapsed, getMatchEventLane } from '#flib/matchEvents';
import type {
  MatchTimelineDraft,
  MatchTimelineDraftStep,
} from '#flib/matchTimelineDraft';
import type { MatchTimelineLookup } from '#flib/matchTimelineLookup';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { getMatchRatedScore } from '#shared/matchTimeline';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { MatchTimelineIssueSeverity } from '#shared/types/api/matchTimeline';
import { MatchEventDescription } from './MatchEventDescription';
import { MatchEventSymbol } from './MatchEventSymbol';
import style from './MatchTimelineTable.module.scss';

export interface MatchTimelineRowProps {
  step: MatchTimelineDraftStep;
  lookup: MatchTimelineLookup;
  reorder: ListReorder;
  draft?: MatchTimelineDraft;

  issueColumn?: boolean;
}

const SeveritySymbols: Record<
  MatchTimelineIssueSeverity,
  SupportedMaterialSymbol
> = {
  ERROR: 'error',
  WARNING: 'warning',
};

const SeverityColors: Record<MatchTimelineIssueSeverity, SymbolColorType> = {
  ERROR: 'red',
  WARNING: 'yellow',
};

export const MatchTimelineRow: Component<MatchTimelineRowProps> = (props) => {
  const uuid = () => props.step.event.uuid;
  const lane = () => getMatchEventLane(props.step.event);

  const isEditable = () => props.draft !== undefined;
  const isSelected = () => props.draft?.isSelected(uuid()) ?? false;

  const severity = () => props.draft?.getEventSeverity(uuid()) ?? null;
  const hasTimeErrors = () =>
    props.draft?.getEventSeverity(uuid(), 'offset') === 'ERROR';

  const score = (): [number, number] | null => {
    const { event } = props.step;

    if (event.type === 'GOAL') return props.step.score;
    if (event.type !== 'SURRENDER') return null;

    const [side1Score, side2Score] = props.step.score;

    return getMatchRatedScore(
      { status: 'SURRENDERED', side1Score, side2Score },
      [event],
      props.lookup.timeline().rules,
    );
  };

  const handleClick = () => {
    props.draft?.setSelectedUuid(isSelected() ? null : uuid());
  };

  const laneSymbol = (side: MatchSide | null) => (
    <Show when={lane() === side}>
      <MatchEventSymbol event={props.step.event} />
    </Show>
  );

  return (
    <Dynamic
      component={isEditable() ? 'button' : 'div'}
      type={isEditable() ? 'button' : undefined}
      aria-pressed={isEditable() ? isSelected() : undefined}
      ref={(element: HTMLElement) =>
        props.reorder.registerItem(uuid(), element)
      }
      classList={{
        [style.row]: true,
        [style.entry]: true,
        [style.interactive]: isEditable(),
        [style.selected]: isSelected(),
        [style.paused]: props.step.paused,
        [style.surrendered]: props.step.event.type === 'SURRENDER',
        [style.dragged]: props.reorder.isDragged(uuid()),
        [style.dropBefore]: props.reorder.isDropTarget(uuid(), 'before'),
        [style.dropAfter]: props.reorder.isDropTarget(uuid(), 'after'),
      }}
      style={{ '--drag-offset': props.reorder.getOffset(uuid()) ?? undefined }}
      onClick={handleClick}
    >
      <Show when={isEditable()}>
        <span
          class={style.handle}
          title="Drag to reorder"
          {...props.reorder.getHandleProps(uuid())}
        >
          <MaterialSymbol symbol="drag_indicator" />
        </span>
      </Show>

      <span
        classList={{
          [style.time]: true,
          [style.invalidValue]: hasTimeErrors(),
        }}
      >
        {formatElapsed(props.step.elapsed)}
      </span>

      <span class={style.lane}>{laneSymbol('SIDE_1')}</span>

      <span
        classList={{
          [style.lane]: true,
          [style.centerLine]: lane() !== null,
        }}
      >
        {laneSymbol(null)}
      </span>

      <span class={style.lane}>{laneSymbol('SIDE_2')}</span>

      <span class={style.description}>
        <TextMarquee>
          <span>
            <MatchEventDescription
              event={props.step.event}
              lookup={props.lookup}
            />
          </span>
        </TextMarquee>
      </span>

      <span class={style.score}>
        <Show when={score()}>
          {(current) => (
            <>
              <span>{current()[0]}</span>
              <span>:</span>
              <span>{current()[1]}</span>
            </>
          )}
        </Show>
      </span>

      <Show when={props.issueColumn}>
        <span class={style.issue}>
          <Show when={severity()}>
            {(currentSeverity) => (
              <MaterialSymbol
                symbol={SeveritySymbols[currentSeverity()]}
                color={SeverityColors[currentSeverity()]}
              />
            )}
          </Show>
        </span>
      </Show>
    </Dynamic>
  );
};
