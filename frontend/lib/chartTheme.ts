import variables from '#styles/variables.module.scss';

const defaultFontSize =
  Number.parseFloat(variables.defaultFontSize) *
  Number.parseFloat(variables.baseFontSize);

export const defaultTheme = {
  color: [
    variables.red,
    variables.green,
    variables.blue,
    variables.yellow,
    variables.redBright,
    variables.greenBright,
    variables.blueBright,
    variables.yellowBright,
    variables.grayBright,
    variables.gray,
  ],
  backgroundColor: 'rgba(0,0,0,0)',
  textStyle: {
    fontFamily: variables.fontFamily,
    color: variables.textColor,
    fontSize: defaultFontSize,
    textBorderWidth: 0,
    textBorderColor: 'transparent',
  },
  title: {
    textStyle: {
      color: variables.primaryBrightColor,
    },
    subtextStyle: {
      color: variables.textColor,
    },
  },
  line: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 3,
    symbol: 'emptyCircle',
    smooth: true,
  },
  radar: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 3,
    symbol: 'emptyCircle',
    smooth: true,
  },
  bar: {
    itemStyle: {
      barBorderWidth: 0,
      barBorderColor: '#ccc',
    },
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
    label: {
      color: variables.textBrightColor,
      textBorderWidth: 0,
      textBorderColor: 'transparent',
    },
  },
  scatter: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  boxplot: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  parallel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  sankey: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  funnel: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  gauge: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  candlestick: {
    itemStyle: {
      color: '#d87a80',
      color0: '#2ec7c9',
      borderColor: '#d87a80',
      borderColor0: '#2ec7c9',
      borderWidth: 1,
    },
  },
  graph: {
    itemStyle: {
      borderWidth: 0,
      borderColor: variables.borderColor,
    },
    lineStyle: {
      width: 1,
      color: variables.textDimColor,
    },
    symbolSize: 3,
    symbol: 'emptyCircle',
    smooth: true,
    label: {
      color: variables.textBrightColor,
    },
  },
  map: {
    itemStyle: {
      areaColor: variables.grayDim,
      borderColor: variables.borderColor,
      borderWidth: 0.5,
    },
    label: {
      color: variables.primaryBrightColor,
    },
    emphasis: {
      itemStyle: {
        areaColor: variables.primaryColor,
        borderColor: variables.textDimColor,
        borderWidth: 1,
      },
      label: {
        color: variables.textBrightColor,
      },
    },
  },
  geo: {
    itemStyle: {
      areaColor: variables.grayDim,
      borderColor: variables.borderColor,
      borderWidth: 0.5,
    },
    label: {
      color: variables.primaryBrightColor,
    },
    emphasis: {
      itemStyle: {
        areaColor: variables.primaryColor,
        borderColor: variables.textDimColor,
        borderWidth: 1,
      },
      label: {
        color: variables.textBrightColor,
      },
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisLabel: {
      show: true,
      color: variables.textBrightColor,
      fontSize: defaultFontSize,
    },
    splitLine: {
      show: false,
    },
    splitArea: {
      show: false,
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisLabel: {
      show: true,
      color: variables.textBrightColor,
      fontSize: defaultFontSize,
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        opacity: 0.25,
        color: variables.gray,
      },
    },
    splitArea: {
      show: false,
    },
  },
  logAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisLabel: {
      show: true,
      color: variables.textBrightColor,
      fontSize: defaultFontSize,
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        opacity: 0.25,
        color: variables.gray,
      },
    },
    splitArea: {
      show: false,
    },
  },
  timeAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: variables.textDimColor,
      },
    },
    axisLabel: {
      show: true,
      color: variables.textBrightColor,
      fontSize: defaultFontSize,
    },
    splitLine: {
      show: true,
      lineStyle: {
        type: 'dashed',
        opacity: 0.25,
        color: variables.gray,
      },
    },
    splitArea: {
      show: false,
    },
  },
  toolbox: {
    iconStyle: {
      borderColor: variables.primaryBrightColor,
    },
    emphasis: {
      iconStyle: {
        borderColor: variables.primaryColor,
      },
    },
  },
  legend: {
    textStyle: {
      color: variables.textColor,
      fontSize: defaultFontSize,
    },
    left: 'center',
    right: 'auto',
    top: 0,
    bottom: 10,
  },
  tooltip: {
    backgroundColor: variables.backgroundColor,
    borderColor: variables.borderColor,

    textStyle: {
      color: variables.textBrightColor,
      fontSize: defaultFontSize,
    },
    axisPointer: {
      lineStyle: {
        color: variables.primaryBrightColor,
        width: 1,
      },
      crossStyle: {
        color: variables.primaryBrightColor,
        width: 1,
      },
    },
  },
  timeline: {
    lineStyle: {
      color: variables.primaryColor,
      width: 1,
    },
    itemStyle: {
      color: variables.primaryColor,
      borderWidth: 1,
    },
    controlStyle: {
      color: variables.primaryColor,
      borderColor: variables.primaryColor,
      borderWidth: 0.5,
    },
    checkpointStyle: {
      color: variables.primaryBrightColor,
      borderColor: variables.primaryColor,
    },
    label: {
      color: variables.primaryColor,
    },
    emphasis: {
      itemStyle: {
        color: variables.primaryBrightColor,
      },
      controlStyle: {
        color: variables.primaryColor,
        borderColor: variables.primaryColor,
        borderWidth: 0.5,
      },
      label: {
        color: variables.primaryColor,
      },
    },
  },
  visualMap: {
    color: [variables.blueBright, variables.backgroundColor, variables.grayDim],
  },
  markPoint: {
    label: {
      color: variables.textBrightColor,
    },
    emphasis: {
      label: {
        color: variables.textBrightColor,
      },
    },
  },
  grid: {
    left: '0%',
    right: '0%',
    top: '0%',
    bottom: '0%',
  },
};
