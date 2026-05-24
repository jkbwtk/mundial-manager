import { createSignal, For, Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from '#components/Sidebar/Sidebar.module.scss';
import { SidebarSwitch } from '#components/Sidebar/SidebarSwitch';
import { isPublicRoute, useCurrentExtendedMatches } from '#flib/solidHelpers';
import { SidebarBase } from './SidebarBase';
import type { SidebarSimpleProps } from './SidebarSimple';

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
