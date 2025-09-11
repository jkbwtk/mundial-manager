import spin from '#assets/images/spin.gif';
import { AnchorButton } from '#components/Button';
import { Divider } from '#components/Widget';
import style from './PageNotFound.module.scss';

const PageNotFound: Component = () => {
  return (
    <div class={style.container}>
      <img src={spin} class={style.animation} alt="Error animation" />

      <span class={style.text}>This is not the way</span>

      <Divider />

      <AnchorButton href="/">Back to homepage</AnchorButton>
    </div>
  );
};

export default PageNotFound;
