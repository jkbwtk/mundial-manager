import { A } from '@solidjs/router';
import { For, type JSX, Show } from 'solid-js';
import { useCurrentExtendedMatches } from '#flib/solidHelpers';
import type { RouteCrumb } from '#frontend/types';
import style from './Breadcrumbs.module.scss';

export interface BreadcrumbsProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const Breadcrumbs: Component<BreadcrumbsProps> = (props) => {
  const currentRoutes = useCurrentExtendedMatches();

  const crumbs = (): RouteCrumb[] => {
    const matches = currentRoutes();
    const last = matches.at(-1);
    const pages = matches.filter(
      (match) => match === last || match.route.component !== undefined,
    );

    return [
      ...(last?.route.info.crumbs?.(last.params) ?? []),
      ...pages.map((match) => ({
        name: match.route.info.name,
        href: match.path,
      })),
    ];
  };

  return (
    <nav
      aria-label="Breadcrumbs"
      classList={{
        [style.container]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <For each={crumbs()}>
        {(crumb, index) => {
          const isLast = () => index() === crumbs().length - 1;

          return (
            <>
              <A href={crumb.href} draggable={false} end={isLast()}>
                {crumb.name}
              </A>
              <Show when={!isLast()}>
                <span> {'>'}</span>
              </Show>
            </>
          );
        }}
      </For>
    </nav>
  );
};
