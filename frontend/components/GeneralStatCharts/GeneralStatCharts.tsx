import { createMemo } from 'solid-js';

import {
  type AxisTooltipParams,
  axisTooltipDefaults,
  type ChartOptions,
  defaultCategoryAxis,
  defaultValueAxis,
  EChartWrapper,
  formatPieTooltip,
  itemTooltipDefaults,
  pieSeriesDefaults,
  type TopLevelFormatterParams,
} from '#components/EChartWrapper';
import { Widget } from '#components/Widget';
import { formatDuration } from '#flib/sheetUtils';
import { getTeamColor } from '#flib/teamColors';
import { useSheets } from '#providers/SheetsProvider';
import variables from '#styles/variables.module.scss';
import style from './GeneralStatCharts.module.scss';

const makePieConfig = (
  name: string,
  data: { name: string; value: number; itemStyle: { color: string } }[],
): ChartOptions => ({
  legend: { top: '5%' },
  tooltip: { ...itemTooltipDefaults, formatter: formatPieTooltip },
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
      grid: { containLabel: true },
      xAxis: { ...defaultCategoryAxis, data: dayLabels() },
      yAxis: { ...defaultValueAxis },
      series: [
        {
          name: 'Matches Per Day',
          type: 'bar',
          data: Object.values(dayStats()).map((d) => d.matches),
          itemStyle: { color: variables.primaryColor },
        },
      ],
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
          ][i],
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
        formatter: (params: TopLevelFormatterParams) => {
          const p = (
            Array.isArray(params) ? params[0] : params
          ) as AxisTooltipParams;
          if (!p) return '';
          return `${p.axisValue ?? p.name}<br/>${p.marker}${p.seriesName}: ${formatDuration(p.value as number)}`;
        },
      },
      grid: { containLabel: true },
      xAxis: { ...defaultCategoryAxis, data: matchLabels() },
      yAxis: {
        ...defaultValueAxis,
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
