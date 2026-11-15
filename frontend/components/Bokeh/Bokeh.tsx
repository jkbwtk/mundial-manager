import { For, type JSX, mergeProps } from 'solid-js';
import { getAmbientSteps, snapToAmbientFrame } from '#flib/ambientFrame';
import { isMobile } from '#flib/utils';
import type { RequiredDefaults } from '#shared/utils';
import { range } from '#shared/utils';
import style from './Bokeh.module.scss';

export type BokehProps = {
  colors: string[];

  count?: number;
  size?: number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

const BOKEH_STEP_FRAMES = 4;

const defaultProps: RequiredDefaults<Omit<BokehProps, 'colors'>> = {
  count: 10,
  size: 9,
  class: '',
  classList: {},
};

export const Bokeh: Component<BokehProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  const count = isMobile() ? Math.ceil(props.count / 2) : props.count;

  const circles = range(count).map((index) => {
    const duration = snapToAmbientFrame(
      14_000 + Math.random() * 16_000,
      BOKEH_STEP_FRAMES,
    );

    return {
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${(props.size * (0.35 + Math.random() * 0.65)).toFixed(1)}rem`,
      color: props.colors[index % props.colors.length],
      duration: `${duration}ms`,
      delay: `${-snapToAmbientFrame(Math.random() * duration, BOKEH_STEP_FRAMES)}ms`,
      steps: getAmbientSteps(duration, BOKEH_STEP_FRAMES),
      driftX: `${Math.round((Math.random() * 2 - 1) * 60)}px`,
      driftY: `${Math.round((Math.random() * 2 - 1) * 40)}px`,
    };
  });

  return (
    <div
      classList={{
        [style.bokeh]: true,
        [props.class]: !!props.class,
        ...props.classList,
      }}
    >
      <For each={circles}>
        {(circle) => (
          <div
            class={style.circle}
            style={{
              left: circle.left,
              top: circle.top,
              width: circle.size,
              height: circle.size,
              '--bokeh-color': circle.color,
              '--drift-x': circle.driftX,
              '--drift-y': circle.driftY,
              'animation-duration': circle.duration,
              'animation-delay': circle.delay,
              'animation-timing-function': circle.steps,
            }}
          />
        )}
      </For>
    </div>
  );
};
