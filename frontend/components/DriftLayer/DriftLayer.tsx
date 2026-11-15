import { createMemo, For, type JSX, mergeProps } from 'solid-js';
import { getAmbientSteps, snapToAmbientFrame } from '#flib/ambientFrame';
import { isMobile } from '#flib/utils';
import { pickRandom } from '#shared/random';
import type { RequiredDefaults } from '#shared/utils';
import { arrayFrom, range } from '#shared/utils';
import style from './DriftLayer.module.scss';

export type DriftLayerProps = {
  color: string | string[];

  direction?: 'down' | 'up';

  particleClass?: string;

  sway?: number;
  spin?: number;

  count?: number;
  duration?: number;
  size?: number;

  front?: number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

interface DriftParticle {
  color: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
  steps: string;
  opacity: string;
  sway: string;
  spin: string;
  restY: string;
  front: boolean;
}

const defaultProps: RequiredDefaults<Omit<DriftLayerProps, 'particleClass'>> = {
  direction: 'down',
  sway: 32,
  spin: 0,
  count: 60,
  duration: 12,
  size: 6,
  front: 0.3,
  class: '',
  classList: {},
};

export const DriftLayer: Component<DriftLayerProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  const colors = () => arrayFrom(props.color);

  const particles = createMemo<DriftParticle[]>(() =>
    range(isMobile() ? Math.ceil(props.count / 2) : props.count).map(() => {
      const depth = 0.3 + Math.random() * 0.7;
      const duration = snapToAmbientFrame((props.duration * 1000) / depth);

      return {
        color: pickRandom(colors()),
        left: `${Math.random() * 100}%`,
        size: `${(props.size * depth).toFixed(1)}px`,
        duration: `${duration}ms`,
        delay: `${-snapToAmbientFrame(Math.random() * duration)}ms`,
        steps: getAmbientSteps(duration),
        opacity: (0.3 + 0.7 * depth).toFixed(2),
        sway: `${Math.round((Math.random() * 2 - 1) * props.sway)}px`,
        spin: `${Math.round((Math.random() * 2 - 1) * props.spin)}deg`,
        restY: `${Math.round(Math.random() * 100)}vh`,
        front: depth > 1 - props.front,
      };
    }),
  );

  return (
    <div
      classList={{
        [style.driftLayer]: true,
        [props.class]: !!props.class,
        ...props.classList,
      }}
    >
      <For each={particles()}>
        {(particle) => (
          <span
            classList={{
              [style.particle]: true,
              [style.dot]: !props.particleClass,
              [props.particleClass ?? '']: !!props.particleClass,
              [style.up]: props.direction === 'up',
              [style.front]: particle.front,
            }}
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
              'background-color': particle.color,
              'animation-duration': particle.duration,
              'animation-delay': particle.delay,
              'animation-timing-function': particle.steps,
              '--sway': particle.sway,
              '--spin': particle.spin,
              '--rest-y': particle.restY,
            }}
          />
        )}
      </For>
    </div>
  );
};
