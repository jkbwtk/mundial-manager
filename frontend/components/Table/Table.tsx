import {
  children,
  createEffect,
  createSignal,
  For,
  type JSX,
  mergeProps,
  on,
  Show,
  splitProps,
} from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { RequiredDefaults } from '#shared/utils';
import style from './Table.module.scss';

export type Column<T = string> = {
  key: T;
  header: string;
  minWidth?: number | 'auto';
  width?: number | 'auto';
  maxWidth?: number | 'auto';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  transform?: ((value: any, row: any) => JSX.Element) | null;
};

export interface TableSorting<S extends string = string> {
  field: S;
  direction: 'asc' | 'desc';
}

export type TableBaseProps<S extends string = string> = {
  columns: Column[];
  data: Record<string, unknown>[];
  classic?: boolean;
  sorting?: TableSorting<S> | null;
  onSort?: (sorting: TableSorting<S>) => void;
};

export interface TableProps<S extends string = string>
  extends Omit<JSX.HTMLAttributes<HTMLTableElement>, 'children'>,
    TableBaseProps<S> {}

const defaultColumn: RequiredDefaults<Column> = {
  align: 'left',
  minWidth: 'auto',
  width: 'auto',
  maxWidth: 'auto',
  sortable: false,
  transform: null,
};

const defaultProps: RequiredDefaults<TableBaseProps> = {
  classic: true,
  sorting: null,
  onSort: () => {},
};

export const Table = <S extends string = string>(
  userProps: TableProps<S>,
): JSX.Element => {
  const mergedProps = mergeProps(defaultProps, userProps);
  const [props, tableProps] = splitProps(mergedProps, [
    'columns',
    'data',
    'sorting',
    'onSort',
    'class',
    'classList',
    'classic',
  ]);

  const [sorting, setSorting] = createSignal(props.sorting ?? null);

  createEffect(
    on(
      () => props.sorting,
      (current) => setSorting(current ?? null),
      { defer: true },
    ),
  );

  const sortSymbol = (): SupportedMaterialSymbol => {
    switch (sorting()?.direction) {
      case 'asc':
        return 'arrow_upward';

      case 'desc':
        return 'arrow_downward';

      default:
        return 'swap_vert';
    }
  };

  const handleSort = (column: Column) => {
    if (!!column.sortable === false) {
      return;
    }

    const current = sorting();
    const next: TableSorting<S> = {
      field: column.key as S,
      direction:
        current?.direction === 'asc' && current.field === column.key
          ? 'desc'
          : 'asc',
    };

    setSorting(next);
    props.onSort(next);
  };

  return (
    <table
      {...tableProps}
      classList={{
        [style.table]: true,
        [style.classic]: props.classic,

        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <thead>
        <tr class={style.header}>
          <For each={props.columns}>
            {(column, index) => {
              return (
                <th
                  style={{
                    '--min-width': column.minWidth ?? defaultColumn.minWidth,
                    '--width': column.width ?? defaultColumn.width,
                    '--max-width': column.maxWidth ?? defaultColumn.maxWidth,
                  }}
                  classList={{
                    [style.valignBottom]: true,
                    [style.sortable]: column.sortable,
                    [style.alignLeft]: column.align === 'left',
                    [style.alignCenter]: column.align === 'center',
                    [style.alignRight]: column.align === 'right',
                    [style.verticalBorder]: index() < props.columns.length - 1,
                    [`data-column-${column.key}`]: true,
                  }}
                  onMouseUp={() => handleSort(column)}
                >
                  {column.header}

                  <Show
                    when={
                      column.sortable &&
                      (sorting() === null || sorting()?.field === column.key)
                    }
                  >
                    <MaterialSymbol symbol={sortSymbol()} interactive={true} />
                  </Show>
                </th>
              );
            }}
          </For>
        </tr>
      </thead>

      <tbody>
        <For each={props.data}>
          {(row, rowIndex) => (
            <tr
              classList={{
                [style.highlightable]: true,
                [`data-row-${rowIndex()}`]: true,
              }}
            >
              <For each={props.columns}>
                {(column, colIndex) => {
                  const value = column.transform
                    ? column.transform(row[column.key], row)
                    : row[column.key];

                  // @ts-expect-error
                  const resolved = children(() => value ?? '-');

                  return (
                    <td
                      classList={{
                        [style.valignTop]: true,
                        [style.alignLeft]: column.align === 'left',
                        [style.alignCenter]: column.align === 'center',
                        [style.alignRight]: column.align === 'right',
                        [style.sortable]: column.sortable,
                        [style.verticalBorder]:
                          colIndex() < props.columns.length - 1,
                        [`data-column-${column.key}`]: true,
                      }}
                    >
                      {resolved()}
                    </td>
                  );
                }}
              </For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  );
};
