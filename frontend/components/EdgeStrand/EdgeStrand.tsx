import { For, type JSX, mergeProps, Show } from 'solid-js';
import { getAmbientSteps } from '#flib/ambientFrame';
import type { RequiredDefaults } from '#shared/utils';
import { range } from '#shared/utils';
import style from './EdgeStrand.module.scss';

export interface EdgeStrandItem {
  mask: string;
  overlay?: string;
  width: number;
  height: number;
  top: number;
  glow?: number;
}

export type EdgeStrandProps = {
  segment: string;
  spacing: number;
  height: number;
  item?: EdgeStrandItem;
  colors?: string[];
  count?: number;
  twinkle?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

const TWINKLE_STEP_FRAMES = 2;

const defaultProps: RequiredDefaults<Omit<EdgeStrandProps, 'item'>> = {
  colors: ['currentColor'],
  count: 24,
  twinkle: false,
  class: '',
  classList: {},
};

function getTwinkleDuration(index: number): number {
  return 1600 + ((index * 5) % 7) * 300;
}

export const EdgeStrand: Component<EdgeStrandProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  return (
    <div
      classList={{
        [style.edgeStrand]: true,
        [props.class]: !!props.class,
        ...props.classList,
      }}
      style={{
        '--segment': `url("${props.segment}")`,
        '--spacing': `${props.spacing}px`,
        '--height': `${props.height}px`,
      }}
      aria-hidden="true"
    >
      <Show when={props.item}>
        {(item) => (
          <For each={range(props.count)}>
            {(index) => (
              <div
                classList={{
                  [style.item]: true,
                  [style.twinkle]: props.twinkle,
                }}
                style={{
                  '--item-mask': `url("${item().mask}")`,
                  '--item-overlay': item().overlay
                    ? `url("${item().overlay}")`
                    : 'none',
                  '--item-color': props.colors[index % props.colors.length],
                  '--item-width': `${item().width}px`,
                  '--item-height': `${item().height}px`,
                  '--item-top': `${item().top}px`,
                  '--item-glow': `${item().glow ?? 0}px`,
                  '--twinkle-delay': `${((index * 7) % 11) * -400}ms`,
                  '--twinkle-duration': `${getTwinkleDuration(index)}ms`,
                  '--twinkle-steps': getAmbientSteps(
                    getTwinkleDuration(index),
                    TWINKLE_STEP_FRAMES,
                  ),
                }}
              />
            )}
          </For>
        )}
      </Show>
    </div>
  );
};
