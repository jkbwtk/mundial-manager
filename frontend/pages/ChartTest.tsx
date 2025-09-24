import { createEffect, createSignal } from 'solid-js';
import { BrailleChart } from '#components/BrailleChart';
import { ChartWrapper } from '#components/ChartWrapper';
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

    return () => clearInterval(interval);
  });

  createEffect(() => {
    const interval = setInterval(() => {
      setBarValues([
        Math.floor(Math.random() * 20) + 5,
        Math.floor(Math.random() * 10) + 1,
        Math.floor(Math.random() * 15) + 2,
      ]);
    }, 5000);

    return () => clearInterval(interval);
  });

  const lineData = () => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'ELO Rating',
        data: animatedData(),
        borderColor: '#00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        tension: 0.1,
        pointBackgroundColor: '#00ff00',
        pointBorderColor: '#ffffff',
      },
      {
        label: 'Team Average',
        data: [1180, 1220, 1200, 1280, 1260, 1300],
        borderColor: '#ff6b35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        tension: 0.1,
        pointBackgroundColor: '#ff6b35',
        pointBorderColor: '#ffffff',
      },
    ],
  });

  const barData = () => ({
    labels: ['Wins', 'Draws', 'Losses'],
    datasets: [
      {
        label: 'Match Results',
        data: barValues(),
        backgroundColor: ['#00ff00', '#ffff00', '#ff0000'],
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  });

  const chartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ffffff',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
        },
      },
    },
  });

  const lineConfig = () => ({
    type: 'line' as const,
    data: lineData(),
    options: chartOptions(),
  });

  const barConfig = () => ({
    type: 'bar' as const,
    data: barData(),
    options: chartOptions(),
  });

  const doughnutConfig = () => ({
    type: 'doughnut' as const,
    data: {
      labels: ['Wins', 'Draws', 'Losses'],
      datasets: [
        {
          data: barValues(),
          backgroundColor: ['#00ff00', '#ffff00', '#ff0000'],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: '#ffffff',
            padding: 20,
          },
        },
      },
    },
  });

  return (
    <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 20px; height: 100vh; padding: 20px;">
      <Widget title="Animated Line Chart (Chart.js)">
        <div style="height: 300px;">
          <ChartWrapper
            config={lineConfig()}
            onChartReady={(chart) => console.log('Line chart ready:', chart)}
          />
        </div>
      </Widget>

      <Widget title="Bar Chart (Chart.js)">
        <div style="height: 300px;">
          <ChartWrapper config={barConfig()} />
        </div>
      </Widget>

      <Widget title="Doughnut Chart (Chart.js)">
        <div style="height: 300px;">
          <ChartWrapper config={doughnutConfig()} />
        </div>
      </Widget>

      <Widget title="Braille Chart (Custom SVG)">
        <BrailleChart />
      </Widget>
    </div>
  );
};

export default ChartTest;
