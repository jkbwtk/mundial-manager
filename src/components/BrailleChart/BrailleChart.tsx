import { For, createSignal, onCleanup, onMount } from 'solid-js';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import styles from './BrailleChart.module.scss';

interface BrailleChartProps {
  // data: DataPoint[];
  // width?: number;
  // height?: number;
  title?: string;
}

export const BrailleChart: Component<BrailleChartProps> = (userProps) => {
  const [{ unit }] = useConsoleUnitPrototype();

  const [bars, setBars] = createSignal(
    Array.from({ length: 66 }, () => Math.random() * 90 + 10),
  );

  let interval: ReturnType<typeof setInterval> | null = null;

  const barWidthDots = 4;

  const barWidth = () => unit.width * (barWidthDots / 2);

  onMount(() => {
    interval = setInterval(() => {
      // Update bars by shifting the array

      setBars((prevBars) => {
        const newBars = [...prevBars.slice(1), Math.random() * 90 + 10];
        return newBars;
      });
    }, 100);
  });

  onCleanup(() => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  });

  return (
    <div class={styles.container}>
      <svg xmlns="http://www.w3.org/2000/svg" height="840px" width="100%">
        <title>{userProps.title || 'Braille Chart'}</title>
        <g>
          <For each={bars()}>
            {(bar, index) => (
              <rect
                class={styles.bar}
                x={`${index() * barWidth()}px`}
                y={`${100 - bar}%`}
                height={`${bar}%`}
                width={`${barWidth()}px`}
                fill={(() => {
                  // return color based on value hash
                  // const hue = (bar * 5) % 360; // Adjust hue based on value
                  // return `hsl(${hue}, 100%, 50%)`;

                  return 'white';
                })()}
              />
            )}
          </For>
        </g>
      </svg>
    </div>
  );
};
