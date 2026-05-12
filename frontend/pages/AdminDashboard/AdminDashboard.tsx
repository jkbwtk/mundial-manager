import { action, createAsync, json, query, useAction } from '@solidjs/router';
import { Show } from 'solid-js';
import { Button } from '#components/Button';
import { LeagueCreatorModal } from '#components/LeagueCreateModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { useTRPC } from '#providers/TRPCProvider';
import type { League, LeagueCreate } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './AdminDashboard.module.scss';

const getLeagues = query(async () => {
  const [{ client }] = useTRPC();

  return await client.admin.leagues.query();
}, 'adminLeagues');

const getActiveLeague = query(async () => {
  const [{ client }] = useTRPC();

  return await client.leagues.activeLeague.query();
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

const createLeague = action(async (league: LeagueCreate) => {
  const [{ client }] = useTRPC();

  const newLeague = await client.admin.createLeague.mutate(league);

  return json(newLeague, {
    revalidate: ['adminLeagues'],
  });
}, 'adminCreateLeague');

export const AdminDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const leagues = createAsync(() => getLeagues());
  const activeLeague = createAsync(() => getActiveLeague());

  const changeLeagueAction = useAction(changeLeague);
  const createLeagueAction = useAction(createLeague);

  const handleCreateLeagueSubmit = async (league: LeagueCreate) => {
    try {
      const result = await createLeagueAction(league);
      actions.success(`Created league: ${result.name}`);
      return { ok: true as const };
    } catch {
      actions.error('Failed to create league');
      return { ok: false as const, message: 'Failed to create league' };
    }
  };

  const handleCreateLeague = () => {
    open({
      props: {
        component: LeagueCreatorModal,
        onCreate: handleCreateLeagueSubmit,
      },
      closeOnBackgroundClick: false,
    });
  };

  const column: Column[] = [
    {
      key: 'uuid',
      header: 'UUID',
      align: 'left',
      width: 8,
      transform: (val) => shortUUID(val),
    },
    {
      key: 'name',
      header: 'Name',
      align: 'left',
    },
    {
      key: 'alias',
      header: 'Alias',
      align: 'left',
    },
    {
      key: 'description',
      header: 'Description',
      align: 'left',
    },
    {
      key: 'links',
      header: 'Links',
      align: 'center',
      width: 13,
      transform: (_, item) => {
        const handleGetLink = useHandleButtonAction(async (league: League) => {
          const link = await getLeagueLink(league.uuid);

          await navigator.clipboard.writeText(link);
          actions.success(
            `Magic link for ${league.alias} copied to the clipboard`,
          );
        });

        return (
          <Button
            severity="secondary"
            onPointerUp={() => handleGetLink(item)}
            loading={handleGetLink.loading()}
          >
            Get Link
          </Button>
        );
      },
    },
    {
      key: 'activate',
      header: 'Activate',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleChangeLeague = useHandleButtonAction(
          async (league: League) => {
            const result = await changeLeagueAction(league.uuid);

            if (result.ok === false) {
              actions.error(result.message ?? 'Failed to change league');
            } else {
              actions.success(`Switched to league: ${result.data.name}`);
            }
          },
        );

        return (
          <Show when={activeLeague()?.uuid !== item.uuid}>
            <Button
              severity="secondary"
              onPointerUp={() => handleChangeLeague(item)}
              loading={handleChangeLeague.loading()}
            >
              Switch
            </Button>
          </Show>
        );
      },
    },
  ];

  return (
    <Widget class={style.container} topLeftLabels="Admin Dashboard">
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

      <Button onPointerUp={handleCreateLeague}>Create League</Button>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={leagues()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};
export default AdminDashboard;
