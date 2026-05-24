import { A } from '@solidjs/router';
import { For, type JSX, Show } from 'solid-js';
import { useCurrentExtendedMatches } from '#flib/solidHelpers';
import style from './Breadcrumbs.module.scss';

export interface BreadcrumbsProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const Breadcrumbs: Component<BreadcrumbsProps> = (props) => {
  const currentRoutes = useCurrentExtendedMatches();

  return (
    <div
      classList={{
        [style.container]: true,
        [props.class!]: !!props.class,
        ...(props.classList || {}),
      }}
    >
      <For each={currentRoutes()}>
        {(route, index) => {
          const isLast = index() === currentRoutes().length - 1;

          return (
            <>
              <A href={route.path} draggable={false} end={isLast}>
                {route.route.info.name}
              </A>
              <Show when={!isLast}>
                <span> {'>'}</span>
              </Show>
            </>
          );
        }}
      </For>
    </div>
  );
};
