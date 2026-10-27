import { For } from 'solid-js';
import { SidebarSwitch } from '#components/Sidebar/SidebarSwitch';
import { useIsVisibleRoute } from '#flib/identity';
import type { ExtendedRouteDefinition } from '#frontend/types';
import style from './Sidebar.module.scss';

export interface SidebarProps {
  routes: ExtendedRouteDefinition[];
}

export const Sidebar: ParentComponent<SidebarProps> = (props) => {
  const isVisibleRoute = useIsVisibleRoute();

  return (
    <nav class={style.container}>
      <For each={props.routes.filter(isVisibleRoute)}>
        {(route) => <SidebarSwitch route={route} pathFragments={['/']} />}
      </For>

      {props.children}
    </nav>
  );
};
