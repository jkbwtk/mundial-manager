import { action, createAsync, json, query, useAction } from '@solidjs/router';
import { For, Show } from 'solid-js';
import { Button } from '#components/Button';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { useToast } from '#providers/ToastProvider';
import { useTRPC } from '#providers/TRPCProvider';
import type { League } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './AdminDashboard.module.scss';

interface LeagueItemProps {
  league: League;
  activeLeague: League | null;
}

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
    return json({ ok: false, message: 'League not found' } as const);
  }

  return json({ ok: true, data: league } as const, {
    revalidate: ['adminActiveLeague'],
  });
}, 'adminChangeLeague');

const getLeagueLink = async (uuid: string) => {
  const [{ client }] = useTRPC();

  const resp = await client.admin.getLeagueLink.query({ uuid });

  return resp.link;
};

const LeagueItem: Component<LeagueItemProps> = (props) => {
  const [, actions] = useToast();

  const changeLeagueAction = useAction(changeLeague);

  const handleGetLink = useHandleButtonAction(async () => {
    const link = await getLeagueLink(props.league.uuid);

    await navigator.clipboard.writeText(link);
    actions.success(
      `Magic link for ${props.league.alias} copied to the clipboard`,
    );
  });

  const handleChangeLeague = useHandleButtonAction(async () => {
    const result = await changeLeagueAction(props.league.uuid);

    if (result.ok === false) {
      actions.error(result.message ?? 'Failed to change league');
    } else {
      actions.success(`Switched to league: ${result.data.name}`);
    }
  });

  return (
    <div class={style.league}>
      <span>{shortUUID(props.league.uuid)}</span>
      <span class={style.name}> {props.league.name}</span>({props.league.alias})
      <span
        classList={{
          [style.description!]: true,
          [style.noDescription!]: !props.league.description,
        }}
      >
        {' '}
        {props.league.description}
      </span>
      <Button onPointerUp={handleGetLink} loading={handleGetLink.loading()}>
        Get Link
      </Button>
      <Show when={props.activeLeague?.uuid !== props.league.uuid}>
        <Button
          onPointerUp={handleChangeLeague}
          loading={handleChangeLeague.loading()}
        >
          Switch
        </Button>
      </Show>
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
      <For each={leagues()?.data}>
        {(league) => (
          <LeagueItem league={league} activeLeague={activeLeague() ?? null} />
        )}
      </For>
    </Widget>
  );
};
export default AdminDashboard;
