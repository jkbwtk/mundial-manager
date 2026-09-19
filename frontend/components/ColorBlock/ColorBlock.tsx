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

  /**
   * Height in console units
   * @default 1
   */
  height?: string | number;

  /** Fills the parent element, `width` and `height` are ignored */
  fill?: boolean;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const ColorBlock: Component<ColorBlockProps> = (props) => {
  return (
    <span
      classList={{
        [style.color]: true,
        [style.fill]: !!props.fill,
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
      style={{
        '--color': props.color,
        '--width': props.width,
        '--height': props.height,
      }}
    />
  );
};
