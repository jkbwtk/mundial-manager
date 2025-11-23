import type { ChartConfiguration } from 'chart.js/auto';
import { createMemo, lazy } from 'solid-js';
import { Widget } from '#components/Widget';
import { formatDuration } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import variables from '#styles/variables.module.scss';
import style from './GeneralStatCharts.module.scss';

const ChartWrapper = lazy(() =>
  import('#components/ChartWrapper').then((c) => ({ default: c.ChartWrapper })),
);

export const GeneralStatCharts: Component = () => {
  const [sheets, { matchStats, dayStats }] = useSheets();

  const dayLabels = createMemo(() =>
    Object.values(dayStats()).map((d) => d.humanDate),
  );

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const matchesPerDayChartConfig = createMemo((): ChartConfiguration => {
    const days = Object.values(dayStats());

    return {
      type: 'bar',
      data: {
        labels: dayLabels(),
        datasets: [
          {
            label: 'Matches Per Day',
            data: days.map((d) => d.matches),
            backgroundColor: variables.primaryColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const matchDurationConfig = createMemo((): ChartConfiguration => {
    return {
      type: 'bar',
      data: {
        labels: matchLabels(),

        datasets: [
          {
            label: 'Match Duration',
            data: sheets.matches.map((m) => m.duration),
            backgroundColor: variables.primaryColor,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value) => formatDuration(Number(value)),
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label;
                const value = formatDuration(Number(context.parsed.y));
                return label ? `${label}: ${value}` : value;
              },
            },
          },
        },
      },
    };
  });

  return (
    <div class={style.chartsContainer}>
      <Widget title="Matches Per Day" class={style.chart}>
        <ChartWrapper config={matchesPerDayChartConfig()} />
      </Widget>

      <Widget title="Match Duration" class={style.chart}>
        <ChartWrapper config={matchDurationConfig()} />
      </Widget>
    </div>
  );
};
