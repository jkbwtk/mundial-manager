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
  DataZoomComponent,
  type DataZoomComponentOption,
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
import { SVGRenderer } from 'echarts/renderers';
import type {
  CallbackDataParams,
  TopLevelFormatterParams,
} from 'echarts/types/dist/shared';
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
    | DataZoomComponentOption
  >;

export interface EChartWrapperProps {
  config: ChartOptions;
  class?: string;
  classList?: Record<string, boolean>;
  onChartReady?: (chart: ECharts) => void;
}

export type { CallbackDataParams, TopLevelFormatterParams };

export type AxisTooltipParams = CallbackDataParams & { axisValue?: string };

export const defaultCategoryAxis = {
  type: 'category' as const,
  axisLabel: { rotate: 50, hideOverlap: true, margin: 14 },
  axisTick: { show: false },
};

export const defaultValueAxis = {
  type: 'value' as const,
  axisTick: { show: false },
};

export const axisTooltipDefaults = {
  trigger: 'axis' as const,
  appendToBody: true,
};
export const itemTooltipDefaults = {
  trigger: 'item' as const,
  appendToBody: true,
};

export const pieSeriesDefaults = {
  type: 'pie' as const,
  radius: '65%',
  center: ['50%', '58%'] as [string, string],
  label: { show: false },
  labelLine: { show: false },
};

export const formatPieTooltip = (params: TopLevelFormatterParams): string => {
  const p = Array.isArray(params) ? params[0] : params;
  if (!p) return '';
  return `${p.marker}${p.name}: ${(p.percent as number | undefined)?.toFixed(1) ?? 0}% (${p.value})`;
};

echarts.registerTheme('default', defaultTheme);

echarts.use([
  GridComponent,
  LegendComponent,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  SVGRenderer,
  DataZoomComponent,
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
