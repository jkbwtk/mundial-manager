import Chart, { type ChartConfiguration, type ChartType } from 'chart.js/auto';
import { createEffect, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import styles from './ChartWrapper.module.scss';

interface ChartWrapperProps<T extends ChartType = ChartType> {
  config: ChartConfiguration<T>;
  class?: string;
  classList?: Record<string, boolean>;
  onChartReady?: (chart: Chart) => void;
}

export const ChartWrapper: Component<ChartWrapperProps> = (props) => {
  // biome-ignore lint/style/useConst: Canvas ref needs to be mutable for assignment
  let canvasRef: HTMLCanvasElement = null!;
  let chart: Chart | null = null;
  let resizeObserver: ResizeObserver | null = null;

  const handleResize = () => {
    if (chart && canvasRef) {
      requestAnimationFrame(() => {
        if (chart) {
          chart.resize();
        }
      });
    }
  };

  onMount(() => {
    if (!isServer) {
      try {
        Chart.defaults.font.family = 'JetBrains Mono, monospace';
        Chart.defaults.backgroundColor = 'transparent';
        Chart.defaults.font.size = 14;

        chart = new Chart(canvasRef, {
          ...props.config,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 50,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            elements: {
              point: {
                radius: 3,
                hoverRadius: 5,
              },
            },
            plugins: {
              legend: {
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                  boxHeight: 6,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  maxTicksLimit: 10,
                  maxRotation: 45,
                  minRotation: 0,
                },
              },
              y: {
                ticks: {
                  maxTicksLimit: 8,
                },
              },
            },
            ...props.config.options,
          },
        });

        if (props.onChartReady) {
          props.onChartReady(chart);
        }

        window.addEventListener('resize', handleResize);

        if (typeof ResizeObserver !== 'undefined' && canvasRef.parentElement) {
          resizeObserver = new ResizeObserver(() => {
            handleResize();
          });
          resizeObserver.observe(canvasRef.parentElement);
        }
      } catch (error) {
        console.error('Failed to create chart:', error);
      }
    }
  });

  onCleanup(() => {
    if (!isServer) {
      window.removeEventListener('resize', handleResize);

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      if (chart) {
        chart.destroy();
        chart = null;
      }
    }
  });

  createEffect(() => {
    if (chart && !isServer) {
      try {
        chart.data = props.config.data;

        if (props.config.options) {
          chart.options = props.config.options;
        }

        chart.update('none');
      } catch (error) {
        console.error('Failed to update chart:', error);
      }
    }
  });

  return (
    <div
      classList={{
        [props.class ?? '']: !!props.class,
        [styles.container]: true,
        ...(props.classList ?? {}),
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};
