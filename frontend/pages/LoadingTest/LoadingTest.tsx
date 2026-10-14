import { For } from 'solid-js';
import { Button } from '#components/Button';
import { LoadingIndicator } from '#components/LoadingIndicator';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Skeleton } from '#components/Skeleton';
import { Divider, Widget } from '#components/Widget';
import style from './LoadingTest.module.scss';

const skeletonBackgrounds = [
  { label: 'Text line (current)', class: style.textLineBackground },
  { label: 'Braille', class: style.brailleBackground },
  { label: 'Shade', class: style.shadeBackground },
  { label: 'Checker', class: style.checkerBackground },
  { label: 'Scanline', class: style.scanlineBackground },
  { label: 'Cell', class: style.cellBackground },
  { label: 'Striped', class: style.stripedBackground },
  { label: 'Dash', class: style.dashBackground },
  { label: 'Word', class: style.wordBackground },
  { label: 'Lower block', class: style.lowerBlockBackground },
  { label: 'Leader', class: style.leaderBackground },
  { label: 'Crosshatch', class: style.crosshatchBackground },
  { label: 'Noise', class: style.noiseBackground },
  { label: 'Grid', class: style.gridBackground },
];

export const LoadingTest: Component = () => {
  let ref!: HTMLDivElement;

  const replay = () => {
    for (const animation of ref.getAnimations({ subtree: true })) {
      animation.cancel();
      animation.play();
    }
  };

  return (
    <div ref={ref} class={style.outerContainer}>
      <Button severity="secondary" onClick={replay}>
        <MaterialSymbol symbol="refresh" /> Replay reveal
      </Button>

      <Widget topLeftLabels="Loading Indicator Component Tests">
        <div class={style.container}>
          <br />
          Default indicator: <LoadingIndicator />
          <Divider />
          Indicator with label: <LoadingIndicator label="Loading..." />
          <Divider />
          Indicator without delay:{' '}
          <LoadingIndicator label="Loading..." delay={0} />
          <Divider />
          Indicator with long delay (1s):{' '}
          <LoadingIndicator label="Loading..." delay={1000} />
        </div>
      </Widget>

      <Widget topLeftLabels="Skeleton Component Tests">
        <div class={style.container}>
          <br />
          Fill width skeleton:
          <Skeleton />
          <Divider />
          Fixed width skeleton (10 cells): <Skeleton width={10} />
          <Divider />
          Multi line skeleton (3 lines):
          <Skeleton lines={3} />
          <Divider />
          Skeleton without delay:
          <Skeleton delay={0} />
          <Divider />
          Skeleton with long delay (1s):
          <Skeleton delay={1000} />
          <Divider />
          Skeletons as table placeholder:
          <div class={style.table}>
            <Skeleton width={8} />
            <Skeleton />
            <Skeleton width={6} />
            <Skeleton width={8} />
            <Skeleton />
            <Skeleton width={6} />
            <Skeleton width={8} />
            <Skeleton />
            <Skeleton width={6} />
          </div>
        </div>
      </Widget>

      <Widget topLeftLabels="Skeleton Background Test">
        <div class={style.backgrounds}>
          <For each={skeletonBackgrounds}>
            {(background) => (
              <div>
                {background.label}
                <span
                  classList={{
                    [style.background]: true,
                    [background.class]: true,
                  }}
                />
              </div>
            )}
          </For>
        </div>
      </Widget>
    </div>
  );
};

export default LoadingTest;
