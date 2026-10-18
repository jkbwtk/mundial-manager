import { Show } from 'solid-js';
import { PlayerLink } from '#components/PlayerLink';
import { SimpleTable, type SimpleTableColumn } from '#components/SimpleTable';
import { Skeleton } from '#components/Skeleton';
import { Widget } from '#components/Widget';
import { usePlayerLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryPeriodStats } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import { formatDate } from '#shared/timeUtils';
import type { LuckStatsEntry } from '#shared/types/api/stats';
import type { LuckComeback } from '#shared/types/stats/luckStats';
import style from './LuckStats.module.scss';

export const LuckStats: Component = () => {
  const [period] = useStatsPeriod();
  const players = usePlayerLookup();
  const timeZone = useLeagueTimeZone();

  const getComebackTitle = (bestComeback: LuckComeback) =>
    `Won the ${formatDate(bestComeback.startDate, timeZone())} match from ${bestComeback.score}`;

  const getComebackRowTitle = (row: LuckStatsEntry) =>
    row.stats.bestComeback === null
      ? undefined
      : getComebackTitle(row.stats.bestComeback);

  const columns: SimpleTableColumn<LuckStatsEntry>[] = [
    {
      header: 'Player',
      fill: true,
      render: (row) => (
        <PlayerLink uuid={row.uuid} name={players.getLabel(row.uuid)} />
      ),
    },
    {
      header: 'Luck',
      align: 'right',
      render: (row) =>
        `${row.stats.luck < 0 ? '-' : '+'}${Math.abs(row.stats.luck).toFixed(1)}`,
      title: (row) =>
        `${row.stats.wins} wins, ${row.stats.goalWins.toFixed(1)} earned by goals, ${row.stats.expectedWins.toFixed(1)} expected`,
      cellClassList: (row) => ({
        [style.positive]: row.stats.luck > 0,
        [style.negative]: row.stats.luck < 0,
      }),
    },
    {
      header: 'Comeback',
      headerColSpan: 2,
      align: 'right',
      class: style.dim,
      render: (row) => row.stats.bestComeback?.score,
      title: getComebackRowTitle,
    },
    {
      align: 'right',
      class: style.dim,
      render: (row) =>
        row.stats.bestComeback === null
          ? null
          : `${(row.stats.bestComeback.probability * 100).toFixed(1)}%`,
      title: getComebackRowTitle,
    },
  ];

  const periodStats = createResilientAsync(
    () => period.period,
    queryPeriodStats,
  );

  const entries = () => periodStats.latest?.luck ?? [];

  return (
    <Widget
      class={style.widget}
      topLeftLabels="Luck"
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
            sort={(a, b) => b.stats.luck - a.stats.luck}
          />
        </Show>
      </Show>
    </Widget>
  );
};
