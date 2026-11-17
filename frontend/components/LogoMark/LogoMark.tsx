import type { JSX } from 'solid-js';
import style from './LogoMark.module.scss';

export interface LogoMarkProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const LogoMark: Component<LogoMarkProps> = (props) => {
  return (
    <a
      href="/"
      aria-label="Mundial Manager"
      classList={{
        'no-style': true,
        [style.logoMark]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    />
  );
};
