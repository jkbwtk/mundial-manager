import type { JSX } from 'solid-js';
import style from './ColorBlock.module.scss';

export interface ColorBlockProps {
  /**
   * Any CSS compatible color
   * @default $textColor
   */
  color: string;

  /**
   * Width in console units
   * @default 10
   */
  width?: string | number;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const ColorBlock: Component<ColorBlockProps> = (props) => {
  return (
    <span
      classList={{
        [style.color]: true,
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
      style={{
        '--color': props.color,
        '--width': props.width,
      }}
    />
  );
};
