import { AggregateStatsGrid } from '#components/AggregateStatsGrid';
import { Widget } from '#components/Widget';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryPeriodStats } from '#flib/trpcCalls';
import style from './GeneralStats.module.scss';

export const GeneralStats: Component = () => {
  const periodStats = createResilientAsync(() => null, queryPeriodStats);

  return (
    <Widget class={style.widget} topLeftLabels="All-Time Stats">
      <AggregateStatsGrid stats={periodStats.latest?.general} />
    </Widget>
  );
};
