import type { JSX, ValidComponent } from 'solid-js';
import { children, For, mergeProps, splitProps } from 'solid-js';
import { Dynamic, type DynamicProps } from 'solid-js/web';
import style from './Widget.module.scss';

export type Widget<T extends ValidComponent> = DynamicProps<T> & {
  topLeftLabels?: JSX.Element;
  topRightLabels?: JSX.Element;

  bottomLeftLabels?: JSX.Element;
  bottomRightLabels?: JSX.Element;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];

  children?: JSX.Element;
};

export type WidgetPropsWithoutComponent<T extends ValidComponent> = Omit<
  Widget<T>,
  'component'
>;

export function BaseWidget<T extends ValidComponent>(userProps: Widget<T>) {
  const [props, widgetProps] = splitProps(userProps, [
    'topLeftLabels',
    'topRightLabels',
    'bottomLeftLabels',
    'bottomRightLabels',
    'children',
    'class',
    'classList',
    'component',
  ]);

  const defaultComponent = 'div';

  const topLeftLabels = children(() => props.topLeftLabels);
  const topRightLabels = children(() => props.topRightLabels);

  const bottomLeftLabels = children(() => props.bottomLeftLabels);
  const bottomRightLabels = children(() => props.bottomRightLabels);

  return (
    <Dynamic
      {...widgetProps}
      classList={{
        [style.container]: true,
        [props.class ?? '']: true,
        ...(props.classList ?? {}),
      }}
      component={props.component ?? defaultComponent}
    >
      {props.children}

      <div class={style.topLabels}>
        <div class={style.leftLabels}>
          <For each={topLeftLabels.toArray().filter((v) => v !== undefined)}>
            {(label) => (
              <div class={style.topLeftLabel}>
                <div class={style.preDecoratorTop} />
                {label}
                <div class={style.postDecoratorTop} />
              </div>
            )}
          </For>
        </div>

        <div class={style.rightLabels}>
          <For each={topRightLabels.toArray().filter((v) => v !== undefined)}>
            {(label) => (
              <div class={style.topRightLabel}>
                <div class={style.preDecoratorTop} />
                {label}
                <div class={style.postDecoratorTop} />
              </div>
            )}
          </For>
        </div>
      </div>

      <div class={style.bottomLabels}>
        <div class={style.leftLabels}>
          <For each={bottomLeftLabels.toArray().filter((v) => v !== undefined)}>
            {(label) => (
              <div class={style.bottomLeftLabel}>
                <div class={style.preDecoratorBottom} />
                {label}
                <div class={style.postDecoratorBottom} />
              </div>
            )}
          </For>
        </div>

        <div class={style.rightLabels}>
          <For
            each={bottomRightLabels.toArray().filter((v) => v !== undefined)}
          >
            {(label) => (
              <div class={style.bottomRightLabel}>
                <div class={style.preDecoratorBottom} />
                {label}
                <div class={style.postDecoratorBottom} />
              </div>
            )}
          </For>
        </div>
      </div>
    </Dynamic>
  );
}

export function customWidgetType<T extends ValidComponent>(
  type: T,
  propOverrides: Partial<WidgetPropsWithoutComponent<T>> = {},
) {
  return (userProps: WidgetPropsWithoutComponent<T>) => {
    const props = mergeProps(userProps, propOverrides);

    // @ts-expect-error
    return <BaseWidget {...props} component={type} />;
  };
}

export const Widget = customWidgetType('div');
