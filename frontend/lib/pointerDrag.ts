import { type Accessor, batch, createSignal } from 'solid-js';
import { capturePointer } from '#flib/utils';

export interface PointerDragDelta {
  x: number; // pixels
  y: number; // pixels
}

export interface PointerDragOptions<T> {
  threshold: number; // pixels

  onMove: (data: T, delta: PointerDragDelta, ev: PointerEvent) => void;
  onStart?: (data: T) => void;
  onEnd?: (data: T) => void;
}

export interface PointerDragHandlers {
  onPointerMove: (ev: PointerEvent) => void;
  onPointerUp: (ev: PointerEvent) => void;
  onPointerCancel: (ev: PointerEvent) => void;
}

export interface PointerDrag<T> {
  data: Accessor<T | null>;
  moved: Accessor<boolean>;

  start: (ev: PointerEvent, data: T) => void;
  handlers: PointerDragHandlers;
}

interface PointerDragState<T> {
  data: T;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
}

export function createPointerDrag<T>(
  options: PointerDragOptions<T>,
): PointerDrag<T> {
  const [state, setState] = createSignal<PointerDragState<T> | null>(null);

  const getState = (ev: PointerEvent) => {
    const current = state();

    return current?.pointerId === ev.pointerId ? current : null;
  };

  const start = (ev: PointerEvent, data: T) => {
    capturePointer(ev.currentTarget as Element, ev.pointerId);

    setState({
      data,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      moved: false,
    });
  };

  const handlePointerMove = (ev: PointerEvent) => {
    const current = getState(ev);

    if (current === null) return;

    const delta = {
      x: ev.clientX - current.startX,
      y: ev.clientY - current.startY,
    };

    if (!current.moved && Math.hypot(delta.x, delta.y) < options.threshold) {
      return;
    }

    batch(() => {
      if (!current.moved) {
        setState({ ...current, moved: true });
        options.onStart?.(current.data);
      }

      options.onMove(current.data, delta, ev);
    });
  };

  const handlePointerEnd = (ev: PointerEvent) => {
    const current = getState(ev);

    if (current === null) return;

    batch(() => {
      setState(null);

      if (current.moved) options.onEnd?.(current.data);
    });
  };

  return {
    data: () => state()?.data ?? null,
    moved: () => state()?.moved ?? false,

    start,
    handlers: {
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
}
