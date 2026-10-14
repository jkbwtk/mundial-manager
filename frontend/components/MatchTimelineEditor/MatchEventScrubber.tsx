import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onMount,
  Show,
} from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { KeyedFor } from '#components/KeyedFor';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { formatElapsed, MATCH_EVENT_TIME_STEP_MS } from '#flib/matchEvents';
import { createPointerDrag } from '#flib/pointerDrag';
import { observeElementWidth } from '#flib/solidHelpers';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { secondsToMs } from '#shared/timeUtils';
import { MatchSides } from '#shared/types/api/matchEvent';
import { clamp } from '#shared/utils';
import variables from '#styles/variables.module.scss';
import { MatchEventMarker } from './MatchEventMarker';
import { useMatchTimelineEditor } from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';

interface TimelineDomain {
  declaredEnd: number; // milliseconds since the match start
  from: number; // milliseconds since the match start
  to: number; // milliseconds since the match start
}

interface TimelineTick {
  offset: number;
  position: number;
}

interface MarkerDrag {
  uuid: string;
  originalOffset: number;
  domain: TimelineDomain;
}

interface PlayheadDrag {
  originalOffset: number;
}

const ZoomLevels = [1, 2, 4, 8, 16];
const TickIntervals = [
  1, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
].map((seconds) => secondsToMs(seconds));

const MIN_DOMAIN_MS = 60_000;
const DOMAIN_PADDING = 0.02; // fraction of the timeline length
const DRAG_THRESHOLD_PX = 3;
const MARKER_SPACING_UNITS = 3.5;
const TICK_SPACING_UNITS = 10;

export const MatchEventScrubber: Component = () => {
  const [draft, lookup] = useMatchTimelineEditor();
  const [{ unit }] = useConsoleUnitPrototype();

  let viewportRef!: HTMLDivElement;
  let trackRef!: HTMLDivElement;

  const [zoom, setZoom] = createSignal(1);
  const [zoomChosen, setZoomChosen] = createSignal(false);
  const [viewportWidth, setViewportWidth] = createSignal(0);

  const liveDomain = createMemo(
    (): TimelineDomain => {
      const steps = draft.steps();

      const declaredEnd =
        (lookup.timeline().match.duration ?? 0) + draft.pauseDuration();

      const from = Math.min(0, steps.at(0)?.event.offset ?? 0);
      const to = Math.max(
        declaredEnd,
        steps.at(-1)?.event.offset ?? 0,
        from + MIN_DOMAIN_MS,
      );
      const padding = (to - from) * DOMAIN_PADDING;

      return { declaredEnd, from: from - padding, to: to + padding };
    },
    undefined,
    {
      equals: (previous, next) =>
        previous.declaredEnd === next.declaredEnd &&
        previous.from === next.from &&
        previous.to === next.to,
    },
  );

  const drag = createPointerDrag<MarkerDrag>({
    threshold: DRAG_THRESHOLD_PX,
    onStart: () => draft.beginTransaction(),
    onMove: (state, delta, ev) => {
      const { from, to } = state.domain;
      const shift = (delta.x / trackRef.clientWidth) * (to - from);

      draft.setEventOffset(
        state.uuid,
        getSnappedOffset(
          state.originalOffset + shift,
          ev.shiftKey,
          draft.ripple() ? state.originalOffset : 0,
        ),
      );
    },
    onEnd: () => draft.endTransaction(),
  });

  const playheadDrag = createPointerDrag<PlayheadDrag>({
    threshold: DRAG_THRESHOLD_PX,
    onMove: (state, delta, ev) => {
      const { from, to } = domain();
      const shift = (delta.x / trackRef.clientWidth) * (to - from);

      draft.setPlayhead(
        getSnappedOffset(state.originalOffset + shift, ev.shiftKey),
      );
    },
  });

  const domain = () => drag.data()?.domain ?? liveDomain();

  const toPosition = (offset: number) => {
    const { from, to } = domain();

    return ((offset - from) / (to - from)) * 100;
  };

  const ticks = createMemo(() => {
    const { from, to } = domain();

    const trackUnits = (viewportWidth() * zoom()) / unit.width;
    const maxTicks = Math.max(2, Math.floor(trackUnits / TICK_SPACING_UNITS));

    const interval =
      TickIntervals.find((candidate) => (to - from) / candidate <= maxTicks) ??
      TickIntervals.at(-1)!;

    const result: TimelineTick[] = [];

    for (
      let offset = Math.ceil(from / interval) * interval;
      offset <= to;
      offset += interval
    ) {
      result.push({ offset, position: toPosition(offset) });
    }

    return result;
  });

  const selectedOffset = createMemo(
    () => draft.selectedStep()?.event.offset ?? null,
  );

  const getSnappedOffset = (offset: number, _fine: boolean, origin = 0) => {
    const { from, to } = domain();
    const step = MATCH_EVENT_TIME_STEP_MS;

    return (
      origin + Math.round((clamp(from, to, offset) - origin) / step) * step
    );
  };

  const applyInitialZoom = (width: number) => {
    if (zoomChosen()) return;

    const count = Math.max(1, draft.events().length);
    const fittingZoom = ZoomLevels.find(
      (level) => (width * level) / count >= unit.width * MARKER_SPACING_UNITS,
    );

    setZoom(fittingZoom ?? ZoomLevels.at(-1)!);
  };

  const stepZoom = (direction: -1 | 1) => {
    const index = ZoomLevels.indexOf(zoom()) + direction;

    setZoomChosen(true);
    setZoom(ZoomLevels[clamp(0, ZoomLevels.length - 1, index)]!);
  };

  const handleTrackClick = (ev: MouseEvent) => {
    const { from, to } = domain();
    const rect = trackRef.getBoundingClientRect();
    const ratio = clamp(0, 1, (ev.clientX - rect.left) / rect.width);

    draft.setSelectedUuid(null);
    draft.setPlayhead(
      getSnappedOffset(from + ratio * (to - from), ev.shiftKey),
    );
  };

  const handleMarkerPointerDown = (ev: PointerEvent, uuid: string) => {
    const event = draft.getEvent(uuid);

    if (ev.button !== 0 || event === null) return;

    drag.start(ev, {
      uuid,
      originalOffset: event.offset,
      domain: liveDomain(),
    });
    draft.setSelectedUuid(uuid);
  };

  const handlePlayheadPointerDown = (ev: PointerEvent) => {
    const playhead = draft.playhead();

    if (ev.button !== 0 || playhead === null) return;

    playheadDrag.start(ev, { originalOffset: playhead });
    draft.setSelectedUuid(null);
  };

  createEffect(
    on(
      [draft.selectedUuid, selectedOffset, zoom],
      ([, offset]) => {
        if (offset === null || drag.data() !== null) return;

        const x = (toPosition(offset) / 100) * trackRef.clientWidth;
        const { scrollLeft, clientWidth } = viewportRef;

        if (x >= scrollLeft && x <= scrollLeft + clientWidth) return;

        viewportRef.scrollTo({
          left: x - clientWidth / 2,
          behavior: 'smooth',
        });
      },
      { defer: true },
    ),
  );

  onMount(() => {
    observeElementWidth(viewportRef, (width) => {
      setViewportWidth(width);
      applyInitialZoom(width);
    });
  });

  return (
    <div class={style.scrubber}>
      <div class={style.toolbar}>
        <span class={style.playheadInfo}>
          <Show
            when={draft.playhead() !== null}
            fallback={
              <span class={style.dimmed}>
                Tap the track to place new events
              </span>
            }
          >
            Insert at
            <strong class={style.playheadTime}>
              T+{formatElapsed(draft.playhead() ?? 0)}
            </strong>
            <Button
              severity="secondary"
              padding={0}
              title="Clear insert position"
              onClick={() => draft.setPlayhead(null)}
            >
              <MaterialSymbol symbol="close" />
            </Button>
          </Show>
        </span>

        <span class={style.zoom}>
          <Button
            severity="secondary"
            padding={0}
            title="Zoom out"
            disabled={zoom() === ZoomLevels.at(0)}
            onClick={() => stepZoom(-1)}
          >
            <MaterialSymbol symbol="remove" />
          </Button>

          <span>{zoom()}x</span>

          <Button
            severity="secondary"
            padding={0}
            title="Zoom in"
            disabled={zoom() === ZoomLevels.at(-1)}
            onClick={() => stepZoom(1)}
          >
            <MaterialSymbol symbol="add" />
          </Button>
        </span>
      </div>

      <div ref={viewportRef} class={style.viewport}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: yeah */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: yeah */}
        <div
          ref={trackRef}
          class={style.track}
          style={{ '--zoom': zoom() }}
          onClick={handleTrackClick}
        >
          <div class={style.ruler}>
            <For each={ticks()}>
              {(tick) => (
                <span
                  class={style.tick}
                  style={{ '--position': tick.position }}
                >
                  {formatElapsed(tick.offset)}
                </span>
              )}
            </For>
          </div>

          <For each={MatchSides}>
            {(side) => (
              <div
                classList={{
                  [style.lane]: true,
                  [style.side1]: side === 'SIDE_1',
                  [style.side2]: side === 'SIDE_2',
                }}
              >
                <ColorBlock
                  class={style.laneColor}
                  color={lookup.getSideColor(side)}
                  width={1}
                  height={2}
                />
              </div>
            )}
          </For>

          <div class={style.centerLine} />

          <For each={draft.pauses()}>
            {(pause) => (
              <div
                class={style.pause}
                style={{
                  '--position': toPosition(pause.from),
                  '--size':
                    toPosition(pause.to ?? domain().to) -
                    toPosition(pause.from),
                }}
              >
                <ColorBlock fill color={variables.gray} />
              </div>
            )}
          </For>

          <div
            class={style.matchEnd}
            style={{ '--position': toPosition(domain().declaredEnd) }}
          />

          <Show when={draft.playhead() !== null}>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: yeah */}
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: yeah */}
            <div
              classList={{
                [style.playhead]: true,
                [style.grabbed]: playheadDrag.data() !== null,
              }}
              style={{ '--position': toPosition(draft.playhead() ?? 0) }}
              {...playheadDrag.handlers}
              onPointerDown={handlePlayheadPointerDown}
              onClick={(ev) => ev.stopPropagation()}
            />
          </Show>

          <KeyedFor each={draft.events()} by={(event) => event.uuid}>
            {(event, uuid) => (
              <MatchEventMarker
                event={event()}
                position={toPosition(event().offset)}
                grabbed={drag.data()?.uuid === uuid}
                dragged={drag.data()?.uuid === uuid && drag.moved()}
                dragHandlers={drag.handlers}
                onPointerDown={(ev) => handleMarkerPointerDown(ev, uuid)}
              />
            )}
          </KeyedFor>
        </div>
      </div>
    </div>
  );
};
