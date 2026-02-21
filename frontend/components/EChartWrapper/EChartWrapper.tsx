import {
  BarChart,
  type BarSeriesOption,
  LineChart,
  type LineSeriesOption,
  PieChart,
  type PieSeriesOption,
} from 'echarts/charts';
import {
  type DatasetComponentOption,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  TooltipComponent,
  type TooltipComponentOption,
} from 'echarts/components';
import type { ECharts } from 'echarts/core';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { createEffect, createMemo, onCleanup, onMount } from 'solid-js';
import { defaultTheme } from '#flib/chartTheme';

import styles from './EChartWrapper.module.scss';

export type ChartOptions = echarts.EChartsCoreOption &
  echarts.ComposeOption<
    | BarSeriesOption
    | LineSeriesOption
    | PieSeriesOption
    | GridComponentOption
    | LegendComponentOption
    | DatasetComponentOption
    | TooltipComponentOption
  >;

export interface EChartWrapperProps {
  config: ChartOptions;
  class?: string;
  classList?: Record<string, boolean>;
  onChartReady?: (chart: ECharts) => void;
}

echarts.registerTheme('default', defaultTheme);

echarts.use([
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export const EChartWrapper: Component<EChartWrapperProps> = (props) => {
  let wrapperRef!: HTMLDivElement;
  let chartRef!: HTMLDivElement;
  let chart: ECharts | null = null;

  const options = createMemo<ChartOptions>(() => ({
    ...props.config,
  }));

  onMount(() => {
    chart = echarts.init(chartRef, 'default');

    let resizeTimer: ReturnType<typeof setTimeout>;

    const observer = new ResizeObserver((entries) => {
      clearTimeout(resizeTimer);
      const entry = entries[0];

      resizeTimer = setTimeout(() => {
        if (chart && entry) {
          chart.resize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      }, 100);
    });

    observer.observe(wrapperRef);

    chart.setOption(options());

    if (props.onChartReady) {
      props.onChartReady(chart);
    }

    onCleanup(() => {
      observer.disconnect();
      chart?.dispose();
    });
  });

  createEffect(() => {
    chart?.setOption(options(), { notMerge: true });
  });

  return (
    <div
      ref={wrapperRef}
      classList={{
        [props.class ?? '']: !!props.class,
        [styles.container]: true,
        ...(props.classList ?? {}),
      }}
    >
      <div ref={chartRef} class={styles.chart} />
    </div>
  );
};
