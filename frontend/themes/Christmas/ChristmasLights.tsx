import type { JSX } from 'solid-js';
import { EdgeStrand } from '#components/EdgeStrand';
import bulbUrl from './lightsBulb.svg';
import bulbShineUrl from './lightsBulbShine.svg';
import wireUrl from './lightsWire.svg';

export interface ChristmasLightsProps {
  count: number;
  spacing: number;
  size: number;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const CHRISTMAS_LIGHT_COLORS = [
  '#ee4357',
  '#4a8f64',
  '#e3c06f',
  '#6bb6ff',
  '#f4f7f5',
];

export const ChristmasLights: Component<ChristmasLightsProps> = (props) => (
  <EdgeStrand
    class={props.class}
    classList={props.classList}
    segment={wireUrl}
    spacing={props.spacing}
    height={props.size * 2.4}
    count={props.count}
    colors={CHRISTMAS_LIGHT_COLORS}
    item={{
      mask: bulbUrl,
      overlay: bulbShineUrl,
      width: props.size * 0.66,
      height: props.size * 1.2,
      top: props.size * 0.45,
      glow: props.size * 2.4,
    }}
    twinkle
  />
);
