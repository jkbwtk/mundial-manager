import { For, type JSX, mergeProps, onCleanup, onMount } from 'solid-js';
import type { ThemeEffectProps } from '#frontend/types';
import type { RequiredDefaults } from '#shared/utils';
import { range } from '#shared/utils';
import style from './GlyphBurst.module.scss';

export type GlyphBurstProps = {
  glyphs: string[];
  colors: string[];
  onDone?: () => void;

  count?: number;

  x?: number;
  y?: number;

  spread?: number;
  duration?: number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
};

const defaultProps: RequiredDefaults<
  Omit<GlyphBurstProps, 'glyphs' | 'colors' | 'onDone'>
> = {
  count: 24,
  x: 50,
  y: 50,
  spread: 320,
  duration: 1.6,
  class: '',
  classList: {},
};

export const GlyphBurst: Component<GlyphBurstProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  const particles = range(props.count).map((index) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = props.spread * (0.35 + Math.random() * 0.65);

    return {
      glyph: props.glyphs[index % props.glyphs.length],
      color: props.colors[index % props.colors.length],
      dx: `${Math.cos(angle) * distance}px`,
      dy: `${Math.sin(angle) * distance}px`,
      rotation: `${Math.round(Math.random() * 720 - 360)}deg`,
    };
  });

  onMount(() => {
    const timeoutRef = setTimeout(
      () => props.onDone?.(),
      props.duration * 1000,
    );

    onCleanup(() => clearTimeout(timeoutRef));
  });

  return (
    <div
      classList={{
        [style.glyphBurst]: true,
        [props.class]: !!props.class,
        ...props.classList,
      }}
      style={{
        left: `${props.x}%`,
        top: `${props.y}%`,
        '--burst-duration': `${props.duration}s`,
      }}
      aria-hidden="true"
    >
      <For each={particles}>
        {(particle) => (
          <span
            class={style.particle}
            style={{
              color: particle.color,
              '--dx': particle.dx,
              '--dy': particle.dy,
              '--rotation': particle.rotation,
            }}
          >
            {particle.glyph}
          </span>
        )}
      </For>
    </div>
  );
};

export function createGlyphBurstEffect(
  config: Omit<GlyphBurstProps, 'onDone'>,
): Component<ThemeEffectProps> {
  return (props) => (
    <GlyphBurst
      {...config}
      x={props.origin?.x ?? config.x}
      y={props.origin?.y ?? config.y}
      onDone={props.onDone}
    />
  );
}
