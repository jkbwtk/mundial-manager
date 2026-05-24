import { A } from '@solidjs/router';
import style from '#components/Sidebar/Sidebar.module.scss';
import { hasAuxRoutes } from '#flib/solidHelpers';
import { joinPaths } from '#flib/utils';
import type { ExtendedRouteDefinition } from '#frontend/types';
import { SidebarBase } from './SidebarBase';

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
