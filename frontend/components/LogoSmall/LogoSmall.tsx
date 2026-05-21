import type { JSX } from 'solid-js';
import style from './LogoSmall.module.scss';

export interface LogoSmallProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const LogoSmall: Component<LogoSmallProps> = (props) => {
  const logo = `\
╔╦╗┬ ┬┌┐┌┌┬┐┬┌─┐┬  
║║║│ ││││ │││├─┤│  
╩ ╩└─┘┘└┘─┴┘┴┴ ┴┴─┘`;

  return (
    <pre
      classList={{
        [style.logo]: true,
        [props.class!]: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      {logo}
    </pre>
  );
};
