import { type Accessor, createMemo, For, type JSX, Show } from 'solid-js';
import type { Column } from '#components/Table';
import style from './SimpleTable.module.scss';

export type SimpleTableKey<T> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? K | `${K}.${keyof T[K] & string}`
    : K;
}[keyof T & string];

type SimpleTableRender<T> = (row: T, index: Accessor<number>) => JSX.Element;

interface SimpleTableColumnOptions<T> {
  header?: JSX.Element;
  headerColSpan?: number;

  title?: (row: T) => string | undefined;
  cellClassList?: (row: T) => Record<string, boolean>;

  align?: Column['align'];
  fill?: boolean;
  wrap?: boolean;
  class?: string;
}

export type SimpleTableColumn<T> = SimpleTableColumnOptions<T> &
  (
    | { key: SimpleTableKey<T>; render?: never }
    | { key?: never; render: SimpleTableRender<T> }
  );

export interface SimpleTableProps<T> {
  columns: SimpleTableColumn<T>[];
  rows: T[];

  sort?: (a: T, b: T) => number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface SimpleTableColumnEntry<T> {
  column: SimpleTableColumn<T>;
  render: SimpleTableRender<T>;
}

function getColumnClassList<T>(
  column: SimpleTableColumn<T>,
): Record<string, boolean> {
  return {
    [style.alignLeft]: column.align === 'left',
    [style.alignCenter]: column.align === 'center',
    [style.alignRight]: column.align === 'right',
    [style.fill]: !!column.fill,
    [style.wrap]: !!column.wrap,
  };
}

function getColumnRender<T>(
  column: SimpleTableColumn<T>,
): SimpleTableRender<T> {
  if (column.render !== undefined) return column.render;

  const path = column.key.split('.');

  return (row) => {
    let value: unknown = row;

    for (const segment of path) {
      value = (value as Record<string, unknown> | null)?.[segment];
    }

    return value as JSX.Element;
  };
}

export const SimpleTable = <T,>(props: SimpleTableProps<T>): JSX.Element => {
  const columnEntries = createMemo((): SimpleTableColumnEntry<T>[] =>
    props.columns.map((column) => ({
      column,
      render: getColumnRender(column),
    })),
  );

  const rows = createMemo(() => {
    if (props.sort === undefined) return props.rows;

    return props.rows.toSorted(props.sort);
  });

  const headerEntries = createMemo(() =>
    columnEntries().filter(({ column }) => column.header !== undefined),
  );

  return (
    <table
      classList={{
        [style.simpleTable]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <Show when={headerEntries().length > 0}>
        <thead>
          <tr>
            <For each={headerEntries()}>
              {({ column }) => (
                <td
                  classList={getColumnClassList(column)}
                  colSpan={column.headerColSpan}
                >
                  {column.header}
                </td>
              )}
            </For>
          </tr>
        </thead>
      </Show>

      <tbody>
        <For each={rows()}>
          {(row, index) => (
            <tr>
              <For each={columnEntries()}>
                {({ column, render }) => {
                  const content = render(row, index);
                  const title = column.title?.(row);

                  return (
                    <td
                      classList={{
                        ...getColumnClassList(column),
                        [column.class ?? '']: !!column.class,
                        ...(column.cellClassList?.(row) ?? {}),
                      }}
                      title={title}
                    >
                      {content}
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
