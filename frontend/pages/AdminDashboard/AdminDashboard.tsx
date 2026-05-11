import { action, createAsync, json, query, useAction } from '@solidjs/router';
import { For } from 'solid-js';
import { Button } from '#components/Button';
import { Divider, Widget } from '#components/Widget';
import { useToast } from '#providers/ToastProvider';
import { useTRPC } from '#providers/TRPCProvider';
import type { League } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './AdminDashboard.module.scss';

const getLeagues = query(async () => {
  const [{ client }] = useTRPC();

  return await client.admin.leagues.query();
}, 'adminLeagues');

const getActiveLeague = query(async () => {
  const [{ client }] = useTRPC();

  return await client.league.activeLeague.query();
}, 'adminActiveLeague');

const changeLeague = action(async (uuid: string) => {
  const [{ client }] = useTRPC();

  const league = await client.admin.changeLeague$.mutate({ uuid });

  if (league === null) {
    return json({ ok: false, message: 'League not found' });
  }

  return json(
    { ok: true, data: league },
    { revalidate: ['adminActiveLeague'] },
  );
}, 'adminChangeLeague');

const getLeagueLink = async (uuid: string) => {
  const [{ client }] = useTRPC();

  const resp = await client.admin.getLeagueLink.query({ uuid });

  return resp.link;
};

const LeagueItem: Component<League> = (props) => {
  const [, actions] = useToast();

  const changeLeagueAction = useAction(changeLeague);

  const handleGetLink = async () => {
    const link = await getLeagueLink(props.uuid);

    await navigator.clipboard.writeText(link);
    actions.success(`Magic link for ${props.alias} copied to clipboard`);
  };

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
      <Button onPointerUp={handleGetLink}>Get Link</Button>
      <Button onPointerUp={() => changeLeagueAction(props.uuid)}>Switch</Button>
    </div>
  );
};

export const AdminDashboard: Component = () => {
  const leagues = createAsync(() => getLeagues());
  const activeLeague = createAsync(() => getActiveLeague());

  return (
    <Widget topLeftLabels="Admin Dashboard">
      <div>
        Active League:{' '}
        {activeLeague()?.name ? (
          <>
            {activeLeague()?.name} ({activeLeague()?.alias})
          </>
        ) : (
          'None'
        )}
      </div>
      <Divider />
      <For each={leagues()?.data}>{LeagueItem}</For>
    </Widget>
  );
};
export default AdminDashboard;
