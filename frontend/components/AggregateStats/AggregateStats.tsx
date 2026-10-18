import { For, Show } from 'solid-js';
import { AggregateStatsGrid } from '#components/AggregateStatsGrid';
import { PlayerLink } from '#components/PlayerLink';
import { Divider, Widget } from '#components/Widget';
import { usePlayerLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryPeriodStats } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import style from './AggregateStats.module.scss';

export const AggregateStats: Component = () => {
  const [period, { getLabel }] = useStatsPeriod();
  const players = usePlayerLookup();

  const periodStats = createResilientAsync(
    () => period.period,
    queryPeriodStats,
  );

  const stats = () => periodStats.latest?.general;

  return (
    <Widget
      class={style.widget}
      topLeftLabels={period.type === 'MATCH' ? 'Day Stats' : 'Period Stats'}
      topRightLabels={
        period.type === 'MATCH'
          ? periodStats.latest?.period.day
          : getLabel(period.index)
      }
      pending={periodStats.pending()}
    >
      <AggregateStatsGrid stats={stats()} />

      <Show when={stats()?.players.length}>
        <Divider />
        <div class={style.playerList}>
          <For each={stats()?.players}>
            {(uuid) => <PlayerLink uuid={uuid} name={players.getLabel(uuid)} />}
          </For>
        </div>
      </Show>
    </Widget>
  );
};
