import { A } from '@solidjs/router';
import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useCurrentExtendedMatches } from '#flib/solidHelpers';
import { joinPaths } from '#flib/utils';
import type { ExtendedRouteDefinition } from '#frontend/types';
import style from './Sidebar.module.scss';

export const hasAuxRoutes = (route: ExtendedRouteDefinition): boolean =>
  route.children !== undefined;

export const isPublicRoute = (route: ExtendedRouteDefinition): boolean =>
  route.info.public === true || route.info.public === undefined;

export interface SidebarBaseProps {
  route: ExtendedRouteDefinition;
}

export const SidebarBase: Component<SidebarBaseProps> = (props) => {
  return (
    <>
      <MaterialSymbol symbol={props.route.info.icon ?? 'question_mark'} />
      <span> {props.route.info.name}</span>
    </>
  );
};

export interface SidebarSimpleProps {
  route: ExtendedRouteDefinition;
  pathFragments: string[];
}

export const SidebarSimple: Component<SidebarSimpleProps> = (props) => {
  return (
    <A
      href={joinPaths(...props.pathFragments, props.route.path ?? '')}
      draggable={false}
      end={!hasAuxRoutes(props.route)}
      classList={{
        'no-style': true,
        [style.routeLink]: true,
      }}
    >
      <SidebarBase route={props.route} />
    </A>
  );
};

export const SidebarNested: Component<SidebarSimpleProps> = (props) => {
  const activeRoutes = useCurrentExtendedMatches();

  const isActive = () =>
    activeRoutes().some(
      (r) =>
        'originalPath' in r.route && r.route.originalPath === props.route.path,
    );

  const [isOpen, setIsOpen] = createSignal(isActive());

  return (
    <div class={style.nested}>
      <button
        classList={{
          [style.nestedButton]: true,
          [style.nestedOpen]: isOpen(),
          [style.nestedActive]: isActive(),
        }}
        type="button"
        onPointerUp={() => isActive() === false && setIsOpen((prev) => !prev)}
      >
        <SidebarBase route={props.route} />

        <MaterialSymbol
          classList={{
            [style.nestedIndicator]: true,
          }}
          symbol={'keyboard_arrow_down'}
        />
      </button>

      <Show when={isOpen() || isActive()}>
        <nav
          classList={{
            [style.container]: true,
            [style.nestedContainer]: true,
          }}
        >
          <For each={(props.route.children ?? []).filter(isPublicRoute)}>
            {(child) => (
              <SidebarSwitch
                route={child}
                pathFragments={[...props.pathFragments, props.route.path ?? '']}
              />
            )}
          </For>
        </nav>
      </Show>
    </div>
  );
};

export interface SidebarSwitchProps {
  route: ExtendedRouteDefinition;
  pathFragments: string[];
}

const SidebarSwitch: Component<SidebarSwitchProps> = (props) => {
  return (
    <Switch>
      <Match when={hasAuxRoutes(props.route)}>
        <SidebarNested
          route={props.route}
          pathFragments={props.pathFragments}
        />
      </Match>
      <Match when={!hasAuxRoutes(props.route)}>
        <SidebarSimple
          route={props.route}
          pathFragments={props.pathFragments}
        />
      </Match>
    </Switch>
  );
};

export interface SidebarProps {
  routes: ExtendedRouteDefinition[];
}

export const Sidebar: Component<SidebarProps> = (props) => {
  return (
    <nav class={style.container}>
      <For each={props.routes.filter(isPublicRoute)}>
        {(route) => <SidebarSwitch route={route} pathFragments={['/']} />}
      </For>
    </nav>
  );
};
