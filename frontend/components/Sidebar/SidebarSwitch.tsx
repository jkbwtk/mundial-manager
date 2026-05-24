import { Match, Switch } from 'solid-js';
import { hasAuxRoutes } from '#flib/solidHelpers';
import { SidebarNested } from './SidebarNested';
import { SidebarSimple, type SidebarSimpleProps } from './SidebarSimple';

export const SidebarSwitch: Component<SidebarSimpleProps> = (props) => {
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
