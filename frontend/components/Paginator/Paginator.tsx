import { createMemo, type JSX, onCleanup, onMount, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Dropdown } from '#components/Dropdown';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './Paginator.module.scss';

export interface PaginatorProps {
  total: number;
  limit: number;
  offset: number;
  setOffset: (offset: number) => void;
  setLimit?: (limit: number) => void;

  keyboardNavigation?: boolean;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const PAGINATOR_DEFAULT_LIMIT = 50;
export const PAGINATOR_LIMITS = [20, 50, 100, 250, 500];

export const Paginator: Component<PaginatorProps> = (props) => {
  const lastOffset = createMemo(
    () => Math.max(Math.ceil(props.total / props.limit) - 1, 0) * props.limit,
  );

  const hasPrevious = () => props.offset > 0;
  const hasNext = () => props.offset + props.limit < props.total;

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (!props.keyboardNavigation) return;

    switch (ev.key) {
      case 'ArrowLeft':
        ev.preventDefault();

        if (ev.ctrlKey || ev.shiftKey) {
          props.setOffset(0);
          break;
        }

        props.setOffset(Math.max(props.offset - props.limit, 0));
        break;

      case 'ArrowRight':
        ev.preventDefault();

        if (ev.ctrlKey || ev.shiftKey) {
          props.setOffset(lastOffset());
          break;
        }

        props.setOffset(Math.min(props.offset + props.limit, lastOffset()));
        break;
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    if (isServer) return;
    document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <span
      classList={{
        [style.paginator]: true,
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
    >
      <span>
        <button
          type="button"
          title="First page"
          onClick={() => props.setOffset(0)}
          disabled={!hasPrevious()}
        >
          <MaterialSymbol
            symbol="keyboard_double_arrow_left"
            color="primary"
            highlightColor="primary"
            interactive={hasPrevious()}
          />
        </button>
        <button
          type="button"
          title="Previous page"
          onClick={() =>
            props.setOffset(Math.max(props.offset - props.limit, 0))
          }
          disabled={!hasPrevious()}
        >
          <MaterialSymbol
            symbol="keyboard_arrow_left"
            color="primary"
            highlightColor="primary"
            interactive={hasPrevious()}
          />
        </button>
      </span>

      <span>
        {props.offset + 1}-{Math.min(props.offset + props.limit, props.total)} /{' '}
        {props.total}
      </span>

      <span>
        <button
          type="button"
          title="Next page"
          onClick={() => props.setOffset(props.offset + props.limit)}
          disabled={!hasNext()}
        >
          <MaterialSymbol
            symbol="keyboard_arrow_right"
            color="primary"
            highlightColor="primary"
            interactive={hasNext()}
          />
        </button>
        <button
          type="button"
          title="Last page"
          onClick={() => props.setOffset(lastOffset())}
          disabled={!hasNext()}
        >
          <MaterialSymbol
            symbol="keyboard_double_arrow_right"
            color="primary"
            highlightColor="primary"
            interactive={hasNext()}
          />
        </button>{' '}
      </span>

      <Show when={props.setLimit}>
        {(setLimit) => (
          <span class={style.limit}>
            <Dropdown
              ariaLabel="Page size"
              options={PAGINATOR_LIMITS.map((limit) => ({
                label: `${limit}`,
                value: limit,
              }))}
              value={props.limit}
              onChange={(limit) => setLimit()(limit)}
            />
            <span>per page</span>
          </span>
        )}
      </Show>
    </span>
  );
};
