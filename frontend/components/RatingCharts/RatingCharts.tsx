import { createMemo, createSignal, For, Show } from 'solid-js';
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
import { InlineAction } from '#components/InlineAction';
import { Skeleton } from '#components/Skeleton';
import { Widget } from '#components/Widget';
import { type EntityLookup, usePlayerLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createResilientAsync } from '#flib/resilientAsync';
import { getRatingHistoryQuery } from '#flib/statsPeriod';
import { getSubjectColor } from '#flib/teamColors';
import { queryRatingHistory } from '#flib/trpcCalls';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import { formatDatetime } from '#shared/timeUtils';
import type { Player } from '#shared/types/api/player';
import type {
  RatingHistory,
  RatingHistorySeries,
} from '#shared/types/api/stats';
import type { RatingSubject } from '#shared/types/stats/ratingStats';
import {
  type RatingSystem,
  RatingSystems,
} from '#shared/types/stats/ratingSystem';
import style from './RatingCharts.module.scss';

const ChartedSubjects: RatingSubject[] = [
  'PLAYER',
  'HYBRID',
  'TEAM_INDIVIDUAL',
  'TEAM',
];

const RatingSubjectLabels: Record<RatingSubject, string> = {
  PLAYER: 'Player',
  HYBRID: 'Hybrid',
  TEAM_INDIVIDUAL: 'Team Individual',
  TEAM: 'Team',
};

const RatingSystemLabels: Record<RatingSystem, [key: string, rest: string]> = {
  ELO: ['E', 'lo'],
  GLICKO2: ['G', 'licko-2'],
  SKILL: ['S', 'kill'],
};

function getSeriesData(
  entry: RatingHistorySeries,
  length: number,
): (number | null)[] {
  const data: (number | null)[] = Array.from({ length }, () => null);

  for (const [index, rating] of entry.points) data[index] = rating;

  for (const [index, value] of data.entries()) {
    if (value === null && index > 0) data[index] = data[index - 1] ?? null;
  }

  return data;
}

function makeLineConfig(
  history: RatingHistory,
  series: RatingHistorySeries[],
  labels: string[],
  players: EntityLookup<Player>,
): ChartOptions {
  return {
    legend: legendDefaults,
    grid: gridDefaults,
    tooltip: {
      ...axisTooltipDefaults,
      formatter: formatLinearTooltip((param) => param.value.toFixed(2)),
    },
    xAxis: { ...categoryAxisDefaults, data: labels },
    yAxis: {
      ...valueAxisDefaults,
      axisLabel: { formatter: (val: number) => Math.round(val).toString() },
    },
    series: series.map((entry) => {
      const uuids = entry.playerUuids.toSorted((a, b) =>
        players.getLabel(a).localeCompare(players.getLabel(b)),
      );
      const color =
        entry.subject === 'TEAM'
          ? getSubjectColor(entry.subjectUuid)
          : players.get(entry.subjectUuid)?.color;

      return {
        name: uuids.map(players.getLabel).join(' & '),
        type: 'line' as const,
        data: getSeriesData(entry, history.matchStartDates.length),
        lineStyle: { color },
        itemStyle: { color },
      };
    }),
    dataZoom: dataZoomDefaults,
  };
}

export const RatingCharts: Component = () => {
  const [period] = useStatsPeriod();
  const players = usePlayerLookup();
  const timeZone = useLeagueTimeZone();

  const [system, setSystem] = createSignal<RatingSystem>('ELO');

  const history = createResilientAsync(
    () => getRatingHistoryQuery(period.period),
    queryRatingHistory,
  );

  const labels = createMemo(() =>
    (history.latest?.matchStartDates ?? []).map((date, index) =>
      date ? formatDatetime(date, timeZone()) : `#${index + 1}`,
    ),
  );

  const getConfig = (subject: RatingSubject) => {
    const current = history.latest;

    if (!current) return null;

    const series = current.series.filter(
      (entry) => entry.system === system() && entry.subject === subject,
    );

    return makeLineConfig(current, series, labels(), players);
  };

  return (
    <div class={style.container}>
      <For each={ChartedSubjects}>
        {(subject) => (
          <Widget
            class={style.chart}
            pending={history.pending()}
            topLeftLabels={`${RatingSubjectLabels[subject]} Rating`}
            topRightLabels={(subject === 'PLAYER' ? RatingSystems : []).map(
              (value) => (
                <span
                  classList={{
                    [style.label]: true,
                    [style.active]: system() === value,
                  }}
                >
                  <InlineAction
                    symbol={RatingSystemLabels[value][0].toLowerCase()}
                    content={RatingSystemLabels[value][0]}
                    onAction={() => setSystem(value)}
                  />
                  {RatingSystemLabels[value][1]}
                </span>
              ),
            )}
          >
            <Show when={getConfig(subject)} fallback={<Skeleton lines={20} />}>
              {(config) => <EChartWrapper config={config()} />}
            </Show>
          </Widget>
        )}
      </For>
    </div>
  );
};

export default RatingCharts;
