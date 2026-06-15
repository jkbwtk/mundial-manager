import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { LeagueCreatorModal } from '#components/LeagueCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionChangeLeague,
  actionDeleteLeague,
  queryActiveLeague,
  queryLeagueLink,
  queryLeagues,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { League } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './AdminDashboard.module.scss';

export const AdminDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const leagues = createAsync(() => queryLeagues());
  const activeLeague = createAsync(() => queryActiveLeague());

  const changeLeague = useAction(actionChangeLeague);
  const deleteLeague = useAction(actionDeleteLeague);
  const owner = getOwner();

  const handleCreateLeague = () => {
    open({
      props: {
        component: LeagueCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const column: Column[] = [
    {
      key: 'uuid',
      header: 'UUID',
      align: 'left',
      width: 8,
      transform: (val) => {
        return (
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                .writeText(val)
                .then(() => {
                  actions.success(`UUID ${val} copied to clipboard`);
                })
                .catch(() => {
                  actions.error('Failed to copy UUID to clipboard');
                })
            }
          >
            {shortUUID(val)}
          </button>
        );
      },
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
          const link = await queryLeagueLink(item.uuid);

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
            const result = await changeLeague(league.uuid);

            actions.success(`Switched to league: ${result.name}`);
          },
          () => actions.error('Failed to switch league'),
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
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditLeague = useHandleButtonAction(
          async (league: League) => {
            open({
              props: {
                component: LeagueCreatorModal,
                league,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open League Editor'),
        );

        return (
          <Button
            severity="secondary"
            onPointerUp={() => handleEditLeague(item)}
            loading={handleEditLeague.loading()}
          >
            Edit
          </Button>
        );
      },
    },
    {
      key: 'delete',
      header: 'Delete',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleDeleteLeague = useHandleButtonAction(
          async (league: League) => {
            await deleteLeague(league.uuid);

            actions.success(`Deleted league: ${league.name}`);
          },
          () => actions.error('Failed to delete league'),
        );

        return (
          <Button
            severity="danger"
            onPointerUp={() => handleDeleteLeague(item)}
            loading={handleDeleteLeague.loading()}
          >
            Delete
          </Button>
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
