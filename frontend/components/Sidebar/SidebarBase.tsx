import { MaterialSymbol } from '#components/MaterialSymbol';
import type { ExtendedRouteDefinition } from '#frontend/types';

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
