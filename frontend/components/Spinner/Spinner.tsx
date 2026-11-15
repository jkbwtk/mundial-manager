import { createSignal, type JSX, onCleanup, onMount } from 'solid-js';
import { useTheme } from '#providers/ThemeProvider';
import style from './Spinner.module.scss';

export interface SpinnerProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLSpanElement>['classList'];
}

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const SPINNER_INTERVAL = 200; // milliseconds

export const Spinner: Component<SpinnerProps> = (props) => {
  const [themeState] = useTheme();

  const [spinnerIndex, setSpinnerIndex] = createSignal(0);

  const frames = () => themeState.decorations?.spinnerFrames ?? SPINNER_FRAMES;

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => {
      setSpinnerIndex((prev) => prev + 1);
    }, SPINNER_INTERVAL);
  });

  onCleanup(() => {
    clearInterval(interval);
  });

  return (
    <span
      classList={{
        [style.spinner]: true,
        [props.class!]: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      {frames()[spinnerIndex() % frames().length]}
    </span>
  );
};
