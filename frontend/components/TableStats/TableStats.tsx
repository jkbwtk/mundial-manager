import { Show } from 'solid-js';
import { SimpleTable, type SimpleTableColumn } from '#components/SimpleTable';
import { Skeleton } from '#components/Skeleton';
import { TableLabel } from '#components/TableLabel';
import { Widget } from '#components/Widget';
import { useTableLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { getTableSideColor } from '#flib/teamColors';
import { queryPeriodStats } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import { formatDuration } from '#shared/timeUtils';
import type { TableStatsEntry } from '#shared/types/api/stats';
import style from './TableStats.module.scss';

export const TableStats: Component = () => {
  const [period] = useStatsPeriod();
  const tables = useTableLookup();

  const periodStats = createResilientAsync(
    () => period.period,
    queryPeriodStats,
  );

  const entries = () => periodStats.latest?.tables ?? [];

  const columns: SimpleTableColumn<TableStatsEntry>[] = [
    {
      header: 'Table',
      fill: true,
      render: (row) => (
        <Show when={tables.get(row.uuid)} fallback={tables.getLabel(row.uuid)}>
          {(table) => <TableLabel table={table()} />}
        </Show>
      ),
    },
    { header: 'Matches', align: 'right', key: 'stats.matches' },
    {
      header: 'Time',
      align: 'right',
      render: (row) => formatDuration(row.stats.playtime),
    },
    { header: 'Goals', align: 'right', key: 'stats.goals' },
    {
      header: 'Wins',
      align: 'right',
      render: (row) => (
        <>
          <span
            style={{ color: getTableSideColor(tables.get(row.uuid), 'SIDE_1') }}
          >
            {row.stats.winningSidesCount.SIDE_1 ?? 0}
          </span>
          :
          <span
            style={{ color: getTableSideColor(tables.get(row.uuid), 'SIDE_2') }}
          >
            {row.stats.winningSidesCount.SIDE_2 ?? 0}
          </span>
        </>
      ),
    },
  ];

  return (
    <Widget
      class={style.widget}
      topLeftLabels="Tables"
      pending={periodStats.pending()}
    >
      <Show when={periodStats.latest} fallback={<Skeleton lines={3} />}>
        <Show
          when={entries().length > 0}
          fallback={<span class={style.noData}>No matches</span>}
        >
          <SimpleTable
            columns={columns}
            rows={entries()}
            sort={(a, b) => b.stats.matches - a.stats.matches}
          />
        </Show>
      </Show>
    </Widget>
  );
};
