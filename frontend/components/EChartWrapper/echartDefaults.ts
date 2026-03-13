import type {
  BarSeriesOption,
  LineSeriesOption,
  PieSeriesOption,
} from 'echarts/charts';
import type {
  DatasetComponentOption,
  DataZoomComponentOption,
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import type { ComposeOption, EChartsCoreOption } from 'echarts/core';
import type {
  CallbackDataParams,
  TopLevelFormatterParams,
} from 'echarts/types/dist/shared';
import { arrayFrom } from '#shared/utils';

export type ChartOptions = EChartsCoreOption &
  ComposeOption<
    | BarSeriesOption
    | LineSeriesOption
    | PieSeriesOption
    | GridComponentOption
    | LegendComponentOption
    | DatasetComponentOption
    | TooltipComponentOption
    | DataZoomComponentOption
  >;

export type TypedCallbackDataParams<T> = CallbackDataParams & { value: T };

export const legendDefaults: LegendComponentOption = {
  top: '5px',
  type: 'scroll',
  icon: 'roundRect',
};

export const gridDefaults: GridComponentOption = {
  outerBounds: { top: '30px' },
};

export const categoryAxisDefaults = {
  type: 'category' as const,
  axisTick: { show: false },
};

export const valueAxisDefaults = {
  type: 'value' as const,
  scale: true,
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

export const dataZoomDefaults: DataZoomComponentOption = {
  type: 'inside' as const,
  start: 0,
  end: 100,
  throttle: 50,
};

export const pieSeriesDefaults = {
  type: 'pie' as const,
  radius: '65%',
  center: ['50%', '58%'] as [string, string],
  label: { show: false },
  labelLine: { show: false },
};

const isNumberCallbackDataParams = (
  param: CallbackDataParams,
): param is TypedCallbackDataParams<number> => typeof param.value === 'number';

export const formatLinearTooltip = (
  formatter: (param: TypedCallbackDataParams<number>) => string,
) => {
  return (params: TopLevelFormatterParams): string => {
    const items = arrayFrom(params);
    const header = items[0]?.name ?? '';

    const lines = items
      .map((param) => {
        if (!isNumberCallbackDataParams(param)) return null;

        return `${param.marker}${param.seriesName}: <strong>${formatter(param)}</strong>`;
      })
      .filter((l) => l !== null);

    return [header, ...lines].join('<br/>');
  };
};

export const formatPieTooltip = (
  formatter: (param: TypedCallbackDataParams<number>) => string,
) => {
  return (params: TopLevelFormatterParams): string => {
    const items = arrayFrom(params);

    const lines = items
      .map((param) => {
        if (!isNumberCallbackDataParams(param)) return null;

        return `${param.marker}${param.name}: <strong>${param.percent?.toFixed(1) ?? '0'}% (${formatter(param)})</strong>`;
      })
      .filter((l) => l !== null);

    return lines.join('<br/>');
  };
};
