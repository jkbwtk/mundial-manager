import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  lazy,
  on,
  Show,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Button } from '#components/Button';
import {
  type ChartUnit,
  type Context,
  type DataSource,
  formatUnit,
  GroupingOptions,
  getChartType,
  getDataFromFrame,
  getFramesFromStatType,
  getLabelsFromFrames,
  registry,
} from '#components/ChartBuilder';
import { Dropdown } from '#components/Dropdown';
import {
  axisTooltipDefaults,
  type ChartOptions,
  categoryAxisDefaults,
  dataZoomDefaults,
  gridDefaults,
  legendDefaults,
  valueAxisDefaults,
} from '#components/EChartWrapper';
import type { StatType } from '#components/StatPaginatorWidget';
import { useSheets } from '#providers/SheetsProvider';
import { arrayFrom } from '#shared/utils';
import style from './ChartBuilder.module.scss';

const EChartWrapper = lazy(() =>
  import('#components/EChartWrapper').then((c) => ({
    default: c.EChartWrapper,
  })),
);

interface ChartBuilderProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface ActiveEntries {
  list: Context[];

  get unitMapping(): Map<ChartUnit, number>;
}

export const ChartBuilder: Component<ChartBuilderProps> = (props) => {
  const [, { matchData }] = useSheets();

  const [grouping, setGrouping] = createSignal<StatType>('match');

  const [entries, setEntries] = createStore<ActiveEntries>({
    list: [],
    get unitMapping() {
      const units = new Set<ChartUnit>(
        this.list.map((c: Context) => c.entry.unit).sort(),
      );

      return new Map([...units].map((unit, index) => [unit, index]));
    },
  });

  const frames = () => getFramesFromStatType(matchData(), grouping());
  const sessionLabels = () => getLabelsFromFrames(frames(), grouping());
  const availableEntries = createMemo(() => registry[grouping()]);

  const chartConfig = (): ChartOptions => ({
    legend: legendDefaults,
    grid: gridDefaults,
    xAxis: {
      ...categoryAxisDefaults,
      data: sessionLabels(),
    },
    yAxis:
      entries.unitMapping.size > 0
        ? Array.from(entries.unitMapping.entries()).map(([unit, index]) => ({
            ...valueAxisDefaults,

            position: ['left, right'][index % 2]! as never,
            axisLabel: {
              formatter: (val: number) => formatUnit(val, unit),
            },
          }))
        : valueAxisDefaults,
    tooltip: {
      ...axisTooltipDefaults,
      formatter: (rawParams) => {
        const params = arrayFrom(rawParams);
        const header = params[0]?.name ?? '';

        const lines = params
          .map((param) => {
            if (typeof param.value !== 'number') return null;

            const ctx = entries.list[param.seriesIndex!];
            if (!ctx) return null;

            const formattedVal = formatUnit(param.value, ctx.entry.unit);

            return `${param.marker}${param.seriesName}: <strong>${formattedVal}</strong>`;
          })
          .filter((l) => l !== null);

        return [header, ...lines].join('<br/>');
      },
    },
    series: entries.list.map((ctx) => ({
      name: ctx.entity ? `${ctx.entry.label} (${ctx.entity})` : ctx.entry.label,
      type: getChartType(ctx),
      data: frames().map((frame) => getDataFromFrame(ctx, frame)),
      yAxisIndex: entries.unitMapping.get(ctx.entry.unit) ?? 0,
      itemStyle: {
        color: ctx.entry.getEntityColor?.(ctx),
      },
    })),
    dataZoom: dataZoomDefaults,
  });

  createEffect(
    on([grouping], () => {
      setEntries('list', []);
    }),
  );

  return (
    <div
      classList={{
        [style.chartBuilder]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <div class={style.controls}>
        <Dropdown
          value={grouping()}
          options={GroupingOptions}
          onChange={setGrouping}
        />

        <For each={Object.entries(availableEntries())}>
          {([dataSource, groupingEntries]) => (
            <>
              <strong>{dataSource}</strong>
              <For each={Object.values(groupingEntries)}>
                {(entry) => (
                  <div style={{ 'margin-left': '10px' }}>
                    <span> {entry.label}</span>{' '}
                    <Show
                      when={entry.getEntities?.()}
                      fallback={
                        <Button
                          onPointerUp={() => {
                            setEntries('list', entries.list.length, {
                              dataSource: dataSource as DataSource,
                              entry,
                              grouping: grouping(),
                            });
                          }}
                        >
                          +
                        </Button>
                      }
                    >
                      {(entities) => (
                        <>
                          <Button
                            onPointerUp={() => {
                              setEntries('list', (e) => [
                                ...e,
                                ...entities().map((entity) => ({
                                  dataSource: dataSource as DataSource,
                                  entry,
                                  grouping: grouping(),

                                  entity,
                                })),
                              ]);
                            }}
                          >
                            All
                          </Button>
                          <For each={entities()}>
                            {(entity) => (
                              <div style={{ 'margin-left': '10px' }}>
                                <span>{entity}</span>{' '}
                                <Button
                                  onPointerUp={() => {
                                    setEntries('list', entries.list.length, {
                                      dataSource: dataSource as DataSource,
                                      entry,
                                      grouping: grouping(),

                                      entity,
                                    });
                                  }}
                                >
                                  +
                                </Button>
                              </div>
                            )}
                          </For>
                        </>
                      )}
                    </Show>
                  </div>
                )}
              </For>
            </>
          )}
        </For>
      </div>

      <EChartWrapper config={chartConfig()} />
    </div>
  );
};
