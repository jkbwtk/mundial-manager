import { A } from '@solidjs/router';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './MobileNavBar.module.scss';

export const MobileNavBar: Component = () => {
  return (
    <div class={style.container}>
      <A
        href="/seasons"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="date_range" />
      </A>
      <A
        href="/tables"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="table_restaurant" />
      </A>
      <A
        href="/balls"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="sports_soccer" />
      </A>

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

      <A
        classList={{
          [style.calculatorLink]: true,
          'no-style': true,
        }}
        href="/mundial-calculator"
      >
        +
      </A>

      <A
        href="/players"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="groups" />
      </A>
      <A
        href="/matches"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="gps_fixed" />
      </A>
      <A
        href="/admin"
        classList={{
          [style.entry]: true,
          'no-style': true,
        }}
      >
        <MaterialSymbol symbol="admin_panel_settings" />
      </A>
    </div>
  );
};
