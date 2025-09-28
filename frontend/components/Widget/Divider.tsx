import { type JSX, mergeProps } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './Widget.module.scss';

export type DividerProps = {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  direction?: 'horizontal' | 'vertical';

  /**
   * Binary encoded list of connections (0b00)
   *
   * Connection order: start, end
   */
  connect?: number;

  colors?: number;
};

const defaultProps: RequiredDefaults<DividerProps> = {
  direction: 'horizontal',
  class: '',
  classList: {},
  connect: 0b11,
  colors: 0b11,
};

export const Divider: Component<DividerProps> = (unmergedProps) => {
  const props = mergeProps(defaultProps, unmergedProps);

  return (
    <div
      classList={{
        [style.divider]: true,
        [props.class]: true,

        [style.horizontal]: props.direction === 'horizontal',
        [style.vertical]: props.direction === 'vertical',

        [style.connectStart]: (props.connect & 0b10) !== 0,
        [style.connectEnd]: (props.connect & 0b01) !== 0,

        [style.colorStart]: (props.colors & 0b10) !== 0,
        [style.colorEnd]: (props.colors & 0b01) !== 0,

        ...props.classList,
      }}
    />
  );
};
