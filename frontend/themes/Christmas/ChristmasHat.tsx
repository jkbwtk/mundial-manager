import style from './Christmas.module.scss';
import hatUrl from './hat.svg';

export const ChristmasHat: ParentComponent = (props) => (
  <div class={style.hatAnchor}>
    {props.children}

    <img class={style.hat} src={hatUrl} alt="" aria-hidden="true" />
  </div>
);
