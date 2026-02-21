import { createEffect, createSignal, onCleanup } from 'solid-js';
import { BrailleChart } from '#components/BrailleChart';
import { type ChartOptions, EChartWrapper } from '#components/EChartWrapper';
import { Widget } from '#components/Widget';

const ChartTest: Component = () => {
  const [animatedData, setAnimatedData] = createSignal([
    1200, 1250, 1180, 1300, 1275, 1320,
  ]);
  const [barValues, setBarValues] = createSignal([12, 3, 5]);

  createEffect(() => {
    const interval = setInterval(() => {
      setAnimatedData((prev) =>
        prev.map((val) => val + (Math.random() - 0.5) * 20),
      );
    }, 2000);

    onCleanup(() => clearInterval(interval));
  });

  createEffect(() => {
    const interval = setInterval(() => {
      setBarValues([
        Math.floor(Math.random() * 20) + 5,
        Math.floor(Math.random() * 10) + 1,
        Math.floor(Math.random() * 15) + 2,
      ]);
    }, 5000);

    onCleanup(() => clearInterval(interval));
  });

  const lineChartConfig = (): ChartOptions => ({
    legend: {},
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'ELO Rating',
        type: 'line',
        data: animatedData(),
        smooth: true,
      },
      {
        name: 'Team Average',
        type: 'line',
        data: [1180, 1220, 1200, 1280, 1260, 1300],
        smooth: true,
      },
    ],
    tooltip: { trigger: 'axis' },
  });

  const barChartConfig = (): ChartOptions => ({
    xAxis: { type: 'category', data: ['Wins', 'Draws', 'Losses'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: 'Match Results',
        type: 'bar',
        data: barValues(),
      },
    ],
    tooltip: { trigger: 'axis' },
  });

  const doughnutChartConfig = (): ChartOptions => ({
    legend: { bottom: 0 },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: 'Match Results',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: 'Wins', value: barValues()[0] },
          { name: 'Draws', value: barValues()[1] },
          { name: 'Losses', value: barValues()[2] },
        ],
      },
    ],
  });

  return (
    <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 20px; height: 100vh; padding: 20px;">
      <Widget topLeftLabels="Animated Line Chart (Echarts)">
        <div style="height: 100%;">
          <EChartWrapper config={lineChartConfig()} />
        </div>
      </Widget>

      <Widget topLeftLabels="Bar Chart (Echarts)">
        <div style="height: 100%;">
          <EChartWrapper config={barChartConfig()} />
        </div>
      </Widget>

      <Widget topLeftLabels="Doughnut Chart (Echarts)">
        <div style="height: 100%;">
          <EChartWrapper config={doughnutChartConfig()} />
        </div>
      </Widget>

      <Widget topLeftLabels="Braille Chart (Custom SVG)">
        <BrailleChart />
      </Widget>
    </div>
  );
};

export default ChartTest;
