import type { JSX, ValidComponent } from 'solid-js';
import { Show } from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import { TextMarquee } from '#components/TextMarquee';
import style from './Widget.module.scss';

export type Widget<T extends ValidComponent> = Omit<
  DynamicProps<T>,
  'component'
> & {
  title: string;
  subtitle?: string | number;
  component?: T;
  children?: JSX.Element;
};

export function Widget<T extends ValidComponent = 'div'>(props: Widget<T>) {
  const component = props.component ?? 'div';

  return (
    <Dynamic
      {...props}
      component={component}
      classList={{
        [style.container]: true,
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
    >
      <div class={style.border} />
      <TextMarquee class={style.title}>{props.title}</TextMarquee>

      <Show when={props.subtitle}>
        <TextMarquee class={style.subtitle}>{props.subtitle}</TextMarquee>
      </Show>

      {props.children}
    </Dynamic>
  );
}
