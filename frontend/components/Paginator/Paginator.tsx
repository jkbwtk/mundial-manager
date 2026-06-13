import {
  createMemo,
  type JSX,
  onCleanup,
  onMount,
  type Setter,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './Paginator.module.scss';

export interface PaginatorProps {
  total: number;
  limit: number;
  setLimit: Setter<number>;
  page: number;
  setPage: Setter<number>;

  keyboardNavigation?: boolean;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const Paginator: Component<PaginatorProps> = (props) => {
  const totalPages = createMemo(() => Math.ceil(props.total / props.limit));

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (!props.keyboardNavigation) return;

    switch (ev.key) {
      case 'ArrowLeft':
        ev.preventDefault();

        if (ev.ctrlKey || ev.shiftKey) {
          props.setPage(0);
          break;
        }

        props.setPage((p) => Math.max(p - 1, 0));
        break;

      case 'ArrowRight':
        ev.preventDefault();

        if (ev.ctrlKey || ev.shiftKey) {
          props.setPage(totalPages() - 1);
          break;
        }

        props.setPage((p) => Math.min(p + 1, totalPages() - 1));
        break;
    }
  };

  onMount(() => {
    console.log('witam ja z onMount podczas SSR');
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
          onClick={() => props.setPage(0)}
          disabled={props.page === 0}
        >
          <MaterialSymbol
            symbol="keyboard_double_arrow_left"
            color="primary"
            highlightColor="primary"
            interactive={props.page > 0}
          />
        </button>
        <button
          type="button"
          title="Previous page"
          onClick={() => props.setPage((p) => p - 1)}
          disabled={props.page === 0}
        >
          <MaterialSymbol
            symbol="keyboard_arrow_left"
            color="primary"
            highlightColor="primary"
            interactive={props.page > 0}
          />
        </button>
      </span>

      <span>
        {props.page * props.limit + 1}-
        {Math.min(props.page * props.limit + props.limit, props.total)} /{' '}
        {props.total}
      </span>

      <span>
        <button
          type="button"
          title="Next page"
          onClick={() => props.setPage((p) => p + 1)}
          disabled={props.page >= totalPages() - 1}
        >
          <MaterialSymbol
            symbol="keyboard_arrow_right"
            color="primary"
            highlightColor="primary"
            interactive={props.page < totalPages() - 1}
          />
        </button>
        <button
          type="button"
          title="Last page"
          onClick={() => props.setPage(totalPages() - 1)}
          disabled={props.page >= totalPages() - 1}
        >
          <MaterialSymbol
            symbol="keyboard_double_arrow_right"
            color="primary"
            highlightColor="primary"
            interactive={props.page < totalPages() - 1}
          />
        </button>{' '}
      </span>
    </span>
  );
};
