import { createMemo, For } from 'solid-js';

import {
  axisTooltipDefaults,
  type ChartOptions,
  categoryAxisDefaults,
  dataZoomDefaults,
  EChartWrapper,
  formatLinearTooltip,
  gridDefaults,
  legendDefaults,
  valueAxisDefaults,
} from '#components/EChartWrapper';
import { Widget } from '#components/Widget';
import { generateTeamColor } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import style from './RatingChats.module.scss';

export const RatingCharts: Component = () => {
  const [, { matchStats, matchData, latest }] = useSheets();

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const makeLineConfig = (
    series: { name: string; data: (number | null)[] }[],
  ): ChartOptions => ({
    legend: legendDefaults,
    grid: gridDefaults,
    tooltip: {
      ...axisTooltipDefaults,
      formatter: formatLinearTooltip((param) => param.value.toFixed(2)),
    },
    xAxis: { ...categoryAxisDefaults, data: matchLabels() },
    yAxis: {
      ...valueAxisDefaults,
      axisLabel: { formatter: (val: number) => Math.round(val).toString() },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line' as const,
      data: s.data,
      lineStyle: { color: generateTeamColor(s.name) },
      itemStyle: { color: generateTeamColor(s.name) },
      connectNulls: false,
    })),
    dataZoom: dataZoomDefaults,
  });

  const ratingConfigs = createMemo(() => {
    const players = latest().generalStats.players;
    const teams = latest().generalStats.teams;
    const frames = matchData().frames;

    const playerSeries = (
      getRating: (f: (typeof frames)[number], key: string) => number | null,
    ) =>
      players.map((player) => ({
        name: player,
        data: frames.map((f) => getRating(f, player)),
      }));

    const teamSeries = (
      getRating: (f: (typeof frames)[number], key: string) => number | null,
    ) =>
      teams.map((team) => ({
        name: team,
        data: frames.map((f) => getRating(f, team)),
      }));

    return [
      {
        label: 'Player Elo Chart',
        series: playerSeries(
          (f, p) => f.eloRatings.playerElos[p]?.rating ?? null,
        ),
      },
      {
        label: 'Hybrid Elo Chart',
        series: playerSeries(
          (f, p) => f.eloRatings.hybridElos[p]?.rating ?? null,
        ),
      },
      {
        label: 'Team Individual Elo Chart',
        series: playerSeries(
          (f, p) => f.eloRatings.teamIndividualElos[p]?.rating ?? null,
        ),
      },
      {
        label: 'Team Elo Chart',
        series: teamSeries((f, t) => f.eloRatings.teamElos[t]?.rating ?? null),
      },
      {
        label: 'Player Glicko-2 Chart',
        series: playerSeries(
          (f, p) => f.glicko2Ratings.playerGlicko2[p]?.rating ?? null,
        ),
      },
      {
        label: 'Hybrid Glicko-2 Chart',
        series: playerSeries(
          (f, p) => f.glicko2Ratings.hybridGlicko2[p]?.rating ?? null,
        ),
      },
      {
        label: 'Team Individual Glicko-2 Chart',
        series: playerSeries(
          (f, p) => f.glicko2Ratings.teamIndividualGlicko2[p]?.rating ?? null,
        ),
      },
      {
        label: 'Team Glicko-2 Chart',
        series: teamSeries(
          (f, t) => f.glicko2Ratings.teamGlicko2[t]?.rating ?? null,
        ),
      },
    ].map(({ label, series }) => ({ label, config: makeLineConfig(series) }));
  });

  return (
    <div class={style.chartsContainer}>
      <For each={ratingConfigs()}>
        {({ label, config }) => (
          <Widget topLeftLabels={label} class={style.eloChart}>
            <EChartWrapper config={config} />
          </Widget>
        )}
      </For>
    </div>
  );
};
