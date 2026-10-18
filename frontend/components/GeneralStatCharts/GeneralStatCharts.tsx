import { createMemo, createSignal, Show } from 'solid-js';
import { ButtonGroup } from '#components/ButtonGroup';
import {
  axisTooltipDefaults,
  type ChartOptions,
  categoryAxisDefaults,
  dataZoomDefaults,
  EChartWrapper,
  formatLinearTooltip,
  formatPieTooltip,
  itemTooltipDefaults,
  pieSeriesDefaults,
  valueAxisDefaults,
} from '#components/EChartWrapper';
import { Skeleton } from '#components/Skeleton';
import { Widget } from '#components/Widget';
import { divide } from '#flib/derivedStats';
import { useBallLookup, useTableLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { getSubjectColor, getTableSideColor } from '#flib/teamColors';
import { queryGeneralStatsSeries, queryPeriodStats } from '#flib/trpcCalls';
import { formatDuration } from '#shared/timeUtils';
import type { GeneralStatsSeriesQuery } from '#shared/types/api/stats';
import variables from '#styles/variables.module.scss';
import style from './GeneralStatCharts.module.scss';

interface PieEntry {
  name: string;
  value: number;
  color: string;
}

interface TopPieChartProps {
  title: string;
  entries: PieEntry[] | undefined;
  formatValue: (value: number) => string;
}

const TOP_ENTRY_OPTIONS = [1, 2, 3, 4].map((value) => ({
  label: String(value),
  value,
}));

function makeBarConfig(
  name: string,
  labels: string[],
  data: (number | null)[],
  formatValue?: (value: number) => string,
): ChartOptions {
  return {
    tooltip: {
      ...axisTooltipDefaults,
      formatter: formatValue
        ? formatLinearTooltip((param) => formatValue(param.value))
        : undefined,
    },
    xAxis: { ...categoryAxisDefaults, data: labels },
    yAxis: {
      ...valueAxisDefaults,
      axisLabel: formatValue ? { formatter: formatValue } : undefined,
    },
    series: [
      {
        name,
        type: 'bar',
        data,
        itemStyle: { color: variables.primaryColor },
      },
    ],
    dataZoom: dataZoomDefaults,
  };
}

const TopPieChart: Component<TopPieChartProps> = (props) => {
  const [top, setTop] = createSignal(4);

  const config = createMemo((): ChartOptions | null => {
    if (props.entries === undefined) return null;

    const sorted = props.entries.toSorted((a, b) => b.value - a.value);
    const shown = sorted.slice(0, top());
    const rest = sorted
      .slice(top())
      .reduce((sum, entry) => sum + entry.value, 0);

    const data = shown.map((entry) => ({
      name: entry.name,
      value: entry.value,
      itemStyle: { color: entry.color },
    }));

    if (rest > 0) {
      data.push({
        name: '',
        value: rest,
        itemStyle: { color: variables.gray },
      });
    }

    return {
      legend: { top: '5%', data: shown.map((entry) => entry.name) },
      tooltip: {
        ...itemTooltipDefaults,
        formatter: formatPieTooltip((param) => props.formatValue(param.value)),
      },
      series: [{ ...pieSeriesDefaults, name: props.title, data }],
    };
  });

  return (
    <Widget
      topLeftLabels={props.title}
      topRightLabels={
        <ButtonGroup
          options={TOP_ENTRY_OPTIONS}
          value={top()}
          onChange={setTop}
          ariaLabel={`${props.title} entries`}
        />
      }
      class={style.pieChart}
    >
      <Show when={config()} fallback={<Skeleton lines={10} />}>
        {(config) => (
          <Show
            when={(props.entries?.length ?? 0) > 0}
            fallback={<span class={style.noData}>No data</span>}
          >
            <EChartWrapper config={config()} />
          </Show>
        )}
      </Show>
    </Widget>
  );
};

export const GeneralStatCharts: Component = () => {
  const tables = useTableLookup();
  const balls = useBallLookup();

  const days = createResilientAsync(
    () =>
      ({
        type: 'DAY',
        fields: ['matches', 'playtime', '_matchesWithDuration'],
      }) satisfies GeneralStatsSeriesQuery,
    queryGeneralStatsSeries,
  );
  const allTime = createResilientAsync(() => null, queryPeriodStats);

  const dayLabels = () => days.latest?.keys ?? [];
  const dayValues = (field: 'matches' | 'playtime' | '_matchesWithDuration') =>
    days.latest?.values[field] ?? [];

  const matchesPerDay = createMemo(() =>
    makeBarConfig('Matches', dayLabels(), dayValues('matches')),
  );

  const durationPerDay = createMemo(() =>
    makeBarConfig(
      'Avg. Match Duration',
      dayLabels(),
      dayValues('playtime').map((playtime, index) =>
        divide(playtime ?? 0, dayValues('_matchesWithDuration')[index] ?? 0),
      ),
      formatDuration,
    ),
  );

  const tableEntries = () =>
    allTime.latest?.tables.map(({ uuid, stats }) => ({
      name: tables.getLabel(uuid),
      value: stats.matches,
      color: getTableSideColor(tables.get(uuid), 'SIDE_1'),
    }));

  const ballEntries = () =>
    allTime.latest?.balls.map(({ uuid, stats }) => ({
      name: balls.getLabel(uuid),
      value: stats.playtime,
      color: balls.get(uuid)?.color ?? getSubjectColor(uuid),
    }));

  return (
    <div class={style.chartsContainer}>
      <div class={style.multiChartRow}>
        <Widget topLeftLabels="Matches Per Day" class={style.chart}>
          <Show when={days.latest} fallback={<Skeleton lines={20} />}>
            <EChartWrapper config={matchesPerDay()} />
          </Show>
        </Widget>

        <div class={style.pieChartContainer}>
          <TopPieChart
            title="Matches Per Table"
            entries={tableEntries()}
            formatValue={(value) => value.toFixed(0)}
          />
          <TopPieChart
            title="Playtime Per Ball"
            entries={ballEntries()}
            formatValue={formatDuration}
          />
        </div>
      </div>

      <Widget topLeftLabels="Avg. Match Duration Per Day" class={style.chart}>
        <Show when={days.latest} fallback={<Skeleton lines={20} />}>
          <EChartWrapper config={durationPerDay()} />
        </Show>
      </Widget>
    </div>
  );
};

export default GeneralStatCharts;
