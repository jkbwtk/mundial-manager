import { batch, createSignal, onCleanup } from 'solid-js';
import { createPointerDrag, type PointerDragHandlers } from '#flib/pointerDrag';
import { getScrollParent } from '#flib/utils';

export type ListDropPosition = 'before' | 'after';

export interface ListReorderOptions {
  onMove: (id: string, index: number) => void;
  onGrab?: (id: string) => void;
}

export interface ListReorderHandleProps extends PointerDragHandlers {
  onPointerDown: (ev: PointerEvent) => void;
  onClick: (ev: MouseEvent) => void;
}

export interface ListReorder {
  registerItem: (id: string, element: HTMLElement) => void;
  getHandleProps: (id: string) => ListReorderHandleProps;

  isDragged: (id: string) => boolean;
  isDropTarget: (id: string, position: ListDropPosition) => boolean;
  getOffset: (id: string) => number | null;
}

interface ListDrag {
  id: string;
  index: number;
  startScrollTop: number;
}

const DRAG_THRESHOLD_PX = 4;
const AUTO_SCROLL_EDGE_PX = 40;
const AUTO_SCROLL_STEP_PX = 12;

export function createListReorder(options: ListReorderOptions): ListReorder {
  const items = new Map<string, HTMLElement>();

  let scrollParent: HTMLElement | null = null;
  let middles: number[] = [];
  let indexes = new Map<string, number>();

  const [offsetY, setOffsetY] = createSignal(0);
  const [dropIndex, setDropIndex] = createSignal(0);

  const getScrollTop = () => scrollParent?.scrollTop ?? 0;

  const scrollNearEdge = (clientY: number) => {
    if (scrollParent === null) return;

    const rect = scrollParent.getBoundingClientRect();

    if (clientY < rect.top + AUTO_SCROLL_EDGE_PX) {
      scrollParent.scrollBy(0, -AUTO_SCROLL_STEP_PX);
    } else if (clientY > rect.bottom - AUTO_SCROLL_EDGE_PX) {
      scrollParent.scrollBy(0, AUTO_SCROLL_STEP_PX);
    }
  };

  const drag = createPointerDrag<ListDrag>({
    threshold: DRAG_THRESHOLD_PX,
    onMove: (state, delta, ev) => {
      const scrollShift = getScrollTop() - state.startScrollTop;
      const y = ev.clientY + getScrollTop();

      scrollNearEdge(ev.clientY);

      setOffsetY(delta.y + scrollShift);
      setDropIndex(
        middles.filter((middle, index) => index !== state.index && middle < y)
          .length,
      );
    },
    onEnd: (state) => {
      if (state.index !== dropIndex()) options.onMove(state.id, dropIndex());
    },
  });

  const registerItem = (id: string, element: HTMLElement) => {
    items.set(id, element);

    onCleanup(() => items.delete(id));
  };

  const handlePointerDown = (ev: PointerEvent, id: string) => {
    if (ev.button !== 0) return;

    ev.preventDefault();
    ev.stopPropagation();

    scrollParent = getScrollParent(ev.currentTarget as HTMLElement);

    const bounds = [...items]
      .map(([itemId, item]) => {
        const rect = item.getBoundingClientRect();

        return { id: itemId, middle: rect.top + rect.height / 2 };
      })
      .toSorted((a, b) => a.middle - b.middle);

    middles = bounds.map((bound) => bound.middle + getScrollTop());
    indexes = new Map(bounds.map((bound, index) => [bound.id, index]));

    const index = indexes.get(id) ?? 0;

    batch(() => {
      setOffsetY(0);
      setDropIndex(index);
      drag.start(ev, { id, index, startScrollTop: getScrollTop() });
      options.onGrab?.(id);
    });
  };

  const isDragged = (id: string) => drag.data()?.id === id;

  const isDropTarget = (id: string, position: ListDropPosition) => {
    const state = drag.data();

    if (!drag.moved() || state === null || state.id === id) return false;

    const index = indexes.get(id) ?? 0;
    const slot = index > state.index ? index - 1 : index;

    if (position === 'before') return slot === dropIndex();

    return slot === dropIndex() - 1 && slot === middles.length - 2;
  };

  const getOffset = (id: string) =>
    drag.moved() && isDragged(id) ? offsetY() : null;

  const getHandleProps = (id: string): ListReorderHandleProps => ({
    onPointerDown: (ev) => handlePointerDown(ev, id),
    onClick: (ev) => ev.stopPropagation(),
    ...drag.handlers,
  });

  return { registerItem, getHandleProps, isDragged, isDropTarget, getOffset };
}
