import type { JSX, ValidComponent } from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import style from './WidgetAlt.module.scss';

export type WidgetAltProps<T extends ValidComponent> = Omit<
  DynamicProps<T>,
  'component'
> & {
  component?: T;
  children?: JSX.Element;
};

export function WidgetAlt<T extends ValidComponent = 'div'>(
  props: WidgetAltProps<T>,
) {
  return (
    <Dynamic
      {...props}
      component={props.component ?? 'div'}
      classList={{
        [style.container]: true,
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
    >
      <div class={style.borderContainer}>
        <div class={style.border}>
          <div class={style.border} />
        </div>
      </div>

      {props.children}
    </Dynamic>
  );
}
