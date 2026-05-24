import { For } from 'solid-js';
import { SidebarSwitch } from '#components/Sidebar/SidebarSwitch';
import { isPublicRoute } from '#flib/solidHelpers';
import type { ExtendedRouteDefinition } from '#frontend/types';
import style from './Sidebar.module.scss';

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
