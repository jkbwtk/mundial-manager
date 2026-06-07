import { createMemo, type Setter } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './Paginator.module.scss';

export interface PaginatorProps {
  total: number;
  limit: number;
  setLimit: Setter<number>;
  page: number;
  setPage: Setter<number>;
}

export const Paginator: Component<PaginatorProps> = (props) => {
  const totalPages = createMemo(() => Math.ceil(props.total / props.limit));

  return (
    <span class={style.paginator}>
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

      <span>
        {props.page * props.limit + 1}-
        {Math.min(props.page * props.limit + props.limit, props.total)} /{' '}
        {props.total}
      </span>

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
      </button>
    </span>
  );
};
