import type { ChartConfiguration } from 'chart.js/auto';
import { createMemo, lazy } from 'solid-js';
import { Widget } from '#components/Widget';
import { formatDuration } from '#flib/sheetUtils';
import { getTeamColor } from '#flib/teamColors';
import { useSheets } from '#providers/SheetsProvider';
import variables from '#styles/variables.module.scss';
import style from './GeneralStatCharts.module.scss';

const ChartWrapper = lazy(() =>
  import('#components/ChartWrapper').then((c) => ({ default: c.ChartWrapper })),
);

export const GeneralStatCharts: Component = () => {
  const [sheets, { matchStats, dayStats, latest }] = useSheets();

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

  const matchesPerFloorChartConfig = createMemo((): ChartConfiguration => {
    const count = latest().generalStats.floorMatchCount;

    return {
      type: 'pie',
      data: {
        labels: Object.keys(count).map((floor) => `Floor ${floor}`),
        datasets: [
          {
            label: 'Matches Per Floor',
            data: Object.values(count),
            backgroundColor: [
              variables.green,
              variables.yellow,
              variables.red,
              variables.blue,
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce(
                  (acc, val) => Number(acc) + Number(val),
                  0,
                );

                // @ts-expect-error
                const percent = (context.raw / total) * 100;

                const label = context.dataset.label;
                return `${label}: ${percent.toFixed(2)}% (${context.raw})`;
              },
            },
          },
        },
      },
    };
  });

  const winsPerColorChartConfig = createMemo((): ChartConfiguration => {
    const count = latest().generalStats.colorWinCount;

    return {
      type: 'pie',
      data: {
        labels: Object.keys(count),
        datasets: [
          {
            label: 'Wins Per Color',
            data: Object.values(count),
            backgroundColor: Object.keys(count).map((color) =>
              getTeamColor(color),
            ),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce(
                  (acc, value, index) => {
                    const visible = context.chart.getDataVisibility(index);
                    return visible ? Number(acc) + Number(value) : acc;
                  },
                  0,
                );

                // @ts-expect-error
                const percent = (context.raw / total) * 100;

                const label = context.dataset.label;
                return `${label}: ${percent.toFixed(2)}% (${context.raw})`;
              },
            },
          },
        },
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
                return `${label}: ${value}`;
              },
            },
          },
        },
      },
    };
  });

  return (
    <div class={style.chartsContainer}>
      <div class={style.multiChartRow}>
        <Widget topLeftLabels="Matches Per Day" class={style.chart}>
          <ChartWrapper config={matchesPerDayChartConfig()} />
        </Widget>

        <div class={style.pieChartContainer}>
          <Widget topLeftLabels="Matches Per Floor" class={style.pieChart}>
            <ChartWrapper config={matchesPerFloorChartConfig()} />
          </Widget>

          <Widget topLeftLabels="Wins Per Color" class={style.pieChart}>
            <ChartWrapper config={winsPerColorChartConfig()} />
          </Widget>
        </div>
      </div>

      <Widget topLeftLabels="Match Duration" class={style.chart}>
        <ChartWrapper config={matchDurationConfig()} />
      </Widget>
    </div>
  );
};
