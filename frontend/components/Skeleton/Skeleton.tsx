import { type JSX, mergeProps } from 'solid-js';
import type { RequiredDefaults } from '#shared/utils';
import style from './Skeleton.module.scss';

export type SkeletonProps = {
  width?: number;
  lines?: number;
  delay?: number; // milliseconds

  class?: string;
  classList?: JSX.CustomAttributes<HTMLSpanElement>['classList'];
};

const defaultProps: RequiredDefaults<SkeletonProps> = {
  width: 0,
  lines: 1,
  delay: 200,
  class: '',
  classList: {},
};

export const Skeleton: Component<SkeletonProps> = (userProps) => {
  const props = mergeProps(defaultProps, userProps);

  return (
    <span
      aria-hidden="true"
      classList={{
        [style.skeleton]: true,
        [style.fill]: props.width === 0,
        [props.class]: !!props.class,
        ...props.classList,
      }}
      style={{
        '--skeleton-width': props.width,
        '--skeleton-lines': props.lines,
        '--skeleton-delay': `${props.delay}ms`,
      }}
    />
  );
};
