import { Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import { SimpleTable, type SimpleTableColumn } from '#components/SimpleTable';
import { Skeleton } from '#components/Skeleton';
import { Widget } from '#components/Widget';
import { useBallLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryPeriodStats } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import { formatDuration } from '#shared/timeUtils';
import type { BallStatsEntry } from '#shared/types/api/stats';
import style from './BallStats.module.scss';

export const BallStats: Component = () => {
  const [period] = useStatsPeriod();
  const balls = useBallLookup();

  const periodStats = createResilientAsync(
    () => period.period,
    queryPeriodStats,
  );

  const entries = () => periodStats.latest?.balls ?? [];

  const columns: SimpleTableColumn<BallStatsEntry>[] = [
    {
      header: 'Ball',
      fill: true,
      render: (row) => (
        <>
          <ColorBlock color={balls.get(row.uuid)?.color ?? ''} width={2} />{' '}
          {balls.getLabel(row.uuid)}
        </>
      ),
    },
    { header: 'Matches', align: 'right', key: 'stats.matches' },
    {
      header: 'Time',
      align: 'right',
      render: (row) => formatDuration(row.stats.playtime),
    },
    { header: 'Goals', align: 'right', key: 'stats.goals' },
    { header: 'Outs', align: 'right', key: 'stats.ballOutCount' },
    { header: 'Swaps', align: 'right', key: 'stats.changedInCount' },
  ];

  return (
    <Widget
      class={style.widget}
      topLeftLabels="Balls"
      pending={periodStats.pending()}
    >
      <Show when={periodStats.latest} fallback={<Skeleton lines={3} />}>
        <Show
          when={entries().length > 0}
          fallback={<span class={style.noData}>No ball data</span>}
        >
          <SimpleTable
            columns={columns}
            rows={entries()}
            sort={(a, b) => b.stats.playtime - a.stats.playtime}
          />
        </Show>
      </Show>
    </Widget>
  );
};
