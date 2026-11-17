import { A } from '@solidjs/router';
import style from '#components/Sidebar/Sidebar.module.scss';
import { joinPaths } from '#flib/utils';
import type { ExtendedRouteDefinition } from '#frontend/types';
import { SidebarBase } from './SidebarBase';

export interface SidebarSimpleProps {
  route: ExtendedRouteDefinition;
  pathFragments: string[];
}

export const SidebarSimple: Component<SidebarSimpleProps> = (props) => {
  const href = () => joinPaths(...props.pathFragments, props.route.path ?? '');

  return (
    <A
      href={href()}
      draggable={false}
      end={href() === '/'}
      classList={{
        'no-style': true,
        [style.routeLink]: true,
      }}
    >
      <SidebarBase route={props.route} />
    </A>
  );
};
