import { createMemo } from 'solid-js';

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
import { Widget } from '#components/Widget';
import { getTeamColor } from '#flib/teamColors';
import { useSheets } from '#providers/SheetsProvider';
import { formatDuration } from '#shared/timeUtils';
import variables from '#styles/variables.module.scss';
import style from './GeneralStatCharts.module.scss';

const makePieConfig = (
  name: string,
  data: { name: string; value: number; itemStyle: { color: string } }[],
): ChartOptions => ({
  legend: { top: '5%' },
  tooltip: {
    ...itemTooltipDefaults,
    formatter: formatPieTooltip((param) => param.value.toFixed(0)),
  },
  series: [{ ...pieSeriesDefaults, name, data }],
});

export const GeneralStatCharts: Component = () => {
  const [sheets, { matchStats, dayStats, latest }] = useSheets();

  const dayLabels = createMemo(() =>
    Object.values(dayStats()).map((d) => d.humanDate),
  );

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const matchesPerDayChartConfig = createMemo(
    (): ChartOptions => ({
      tooltip: { ...axisTooltipDefaults },
      xAxis: { ...categoryAxisDefaults, data: dayLabels() },
      yAxis: { ...valueAxisDefaults },
      series: [
        {
          name: 'Matches Per Day',
          type: 'bar',
          data: Object.values(dayStats()).map((d) => d.matches),
          itemStyle: { color: variables.primaryColor },
        },
      ],
      dataZoom: dataZoomDefaults,
    }),
  );

  const matchesPerFloorChartConfig = createMemo((): ChartOptions => {
    const count = latest().generalStats.floorMatchCount;
    return makePieConfig(
      'Matches Per Floor',
      Object.entries(count).map(([floor, val], i) => ({
        name: `Floor ${floor}`,
        value: val,
        itemStyle: {
          color: [
            variables.green,
            variables.yellow,
            variables.red,
            variables.blue,
          ][i % 4]!,
        },
      })),
    );
  });

  const winsPerColorChartConfig = createMemo((): ChartOptions => {
    const count = latest().generalStats.colorWinCount;
    return makePieConfig(
      'Wins Per Color',
      Object.entries(count).map(([color, val]) => ({
        name: color,
        value: val,
        itemStyle: { color: getTeamColor(color) },
      })),
    );
  });

  const matchDurationConfig = createMemo(
    (): ChartOptions => ({
      tooltip: {
        ...axisTooltipDefaults,
        formatter: formatLinearTooltip((param) => formatDuration(param.value)),
      },
      xAxis: { ...categoryAxisDefaults, data: matchLabels() },
      yAxis: {
        ...valueAxisDefaults,
        axisLabel: { formatter: (val: number) => formatDuration(val) },
      },
      series: [
        {
          name: 'Match Duration',
          type: 'bar',
          data: sheets.matches.map((m) => m.duration),
          itemStyle: { color: variables.primaryColor },
        },
      ],
      dataZoom: dataZoomDefaults,
    }),
  );

  return (
    <div class={style.chartsContainer}>
      <div class={style.multiChartRow}>
        <Widget topLeftLabels="Matches Per Day" class={style.chart}>
          <EChartWrapper config={matchesPerDayChartConfig()} />
        </Widget>

        <div class={style.pieChartContainer}>
          <Widget topLeftLabels="Matches Per Floor" class={style.pieChart}>
            <EChartWrapper config={matchesPerFloorChartConfig()} />
          </Widget>

          <Widget topLeftLabels="Wins Per Color" class={style.pieChart}>
            <EChartWrapper config={winsPerColorChartConfig()} />
          </Widget>
        </div>
      </div>

      <Widget topLeftLabels="Match Duration" class={style.chart}>
        <EChartWrapper config={matchDurationConfig()} />
      </Widget>
    </div>
  );
};
