import {
  batch,
  children,
  createSignal,
  For,
  type JSX,
  mergeProps,
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

export type TableBaseProps = {
  columns: Column[];
  data: Record<string, unknown>[];
  classic?: boolean;
  sortBy?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
};

export interface TableProps
  extends Omit<JSX.HTMLAttributes<HTMLTableElement>, 'children'>,
    TableBaseProps {}

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
  sortBy: null,
  sortDirection: null,
  onSort: () => {},
};

export const Table: Component<TableProps> = (userProps) => {
  const mergedProps = mergeProps(defaultProps, userProps);
  const [props, tableProps] = splitProps(mergedProps, [
    'columns',
    'data',
    'sortBy',
    'sortDirection',
    'onSort',
    'class',
    'classList',
    'classic',
  ]);

  const [sortBy, setSortBy] = createSignal(props.sortBy);
  const [sortDirection, setSortDirection] = createSignal(props.sortDirection);

  const sortSymbol = (): SupportedMaterialSymbol => {
    switch (sortDirection()) {
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

    batch(() => {
      const sortColumn = sortBy();
      const direction =
        sortDirection() === 'asc' && sortColumn === column.key ? 'desc' : 'asc';

      setSortBy(column.key);
      setSortDirection(direction);

      props.onSort(column.key, direction);
    });
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
                      (sortDirection() === null || sortBy() === column.key)
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
