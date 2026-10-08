import { A } from '@solidjs/router';
import { type JSX, Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useCan } from '#flib/identity';
import { MatchRecordingPermissions, PermissionEnum } from '#shared/permissions';
import style from './MobileNavBar.module.scss';

interface MobileNavbarProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLDivElement>['classList'];
}

export const MobileNavBar: Component<MobileNavbarProps> = (props) => {
  const can = useCan();

  return (
    <div
      classList={{
        [style.container]: true,
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
    >
      <Show when={can(PermissionEnum.SEASONS_READ)}>
        <A
          href="/seasons"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="date_range" />
        </A>
      </Show>
      <Show when={can(PermissionEnum.TABLES_READ)}>
        <A
          href="/tables"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="table_restaurant" />
        </A>
      </Show>
      <Show when={can(PermissionEnum.BALLS_READ)}>
        <A
          href="/balls"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="sports_soccer" />
        </A>
      </Show>

      <A
        href="/"
        end={true}
        classList={{
          [style.entry]: true,
          [style.homepage]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="dashboard" />
      </A>

      <Show when={can(MatchRecordingPermissions)}>
        <A
          classList={{
            [style.calculatorLink]: true,
            'no-style': true,
          }}
          href="/mundial-calculator"
        >
          +
        </A>
      </Show>

      <Show when={can(PermissionEnum.PLAYERS_READ)}>
        <A
          href="/players"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="groups" />
        </A>
      </Show>
      <Show when={can(PermissionEnum.MATCHES_READ)}>
        <A
          href="/matches"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="gps_fixed" />
        </A>
      </Show>
      <Show when={can(PermissionEnum.LEAGUES_READ)}>
        <A
          href="/admin"
          classList={{
            [style.entry]: true,
            'no-style': true,
          }}
        >
          <MaterialSymbol symbol="admin_panel_settings" />
        </A>
      </Show>
    </div>
  );
};
