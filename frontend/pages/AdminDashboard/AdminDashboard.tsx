import { createAsync, query } from '@solidjs/router';
import { For } from 'solid-js';
import { Widget } from '#components/Widget';
import { useTRPC } from '#providers/TRPCProvider';
import type { League } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './AdminDashboard.module.scss';

const getLeagues = query(async () => {
  const [{ client }] = useTRPC();

  return await client.admin.leagues.query();
}, 'leagues');

const LeagueItem: Component<League> = (props) => {
  return (
    <div class={style.league}>
      <span>{shortUUID(props.uuid)}</span>
      <span class={style.name}> {props.name}</span>({props.alias})
      <span
        classList={{
          [style.description!]: true,
          [style.noDescription!]: !props.description,
        }}
      >
        {' '}
        {props.description}
      </span>
    </div>
  );
};

export const AdminDashboard: Component = () => {
  const leagues = createAsync(() => getLeagues());

  return (
    <Widget topLeftLabels="Admin Dashboard">
      <For each={leagues()?.data}>{LeagueItem}</For>
    </Widget>
  );
};
export default AdminDashboard;
