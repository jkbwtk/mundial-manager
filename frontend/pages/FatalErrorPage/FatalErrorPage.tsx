import { NoHydration } from 'solid-js/web';
import spin from '#assets/images/spin.gif';
import { isDev } from '#flib/utils';
import style from './FatalErrorPage.module.scss';

export interface FatalErrorPageProps {
  error?: Error;
}

export const FatalErrorPage: Component<FatalErrorPageProps> = (props) => {
  if (isDev() && props.error) {
    console.error(props.error);
  }

  return (
    <NoHydration>
      <div class={style.container}>
        <img src={spin} class={style.animation} alt="Error animation" />

        <span class={style.text}>Fatal error</span>
      </div>
    </NoHydration>
  );
};

export default FatalErrorPage;
