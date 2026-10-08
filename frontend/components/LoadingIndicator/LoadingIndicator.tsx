import { type JSX, mergeProps, Show } from 'solid-js';
import { Spinner } from '#components/Spinner';
import type { RequiredDefaults } from '#shared/utils';
import style from './LoadingIndicator.module.scss';

export type LoadingIndicatorProps = {
  label?: string;
  delay?: number; // milliseconds

  class?: string;
  classList?: JSX.CustomAttributes<HTMLSpanElement>['classList'];
};

const defaultProps: RequiredDefaults<LoadingIndicatorProps> = {
  label: '',
  delay: 200,
  class: '',
  classList: {},
};

export const LoadingIndicator: Component<LoadingIndicatorProps> = (
  userProps,
) => {
  const props = mergeProps(defaultProps, userProps);

  return (
    <span
      role="status"
      aria-live="polite"
      classList={{
        [style.loadingIndicator]: true,
        [props.class]: !!props.class,
        ...props.classList,
      }}
      style={{ '--loading-delay': `${props.delay}ms` }}
    >
      <span class={style.spinnerSlot}>
        <Spinner />
      </span>

      <Show when={props.label}>
        <span class={style.label}>{props.label}</span>
      </Show>
    </span>
  );
};
