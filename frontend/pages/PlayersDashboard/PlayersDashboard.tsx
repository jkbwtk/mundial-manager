import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { PlayerCreatorModal } from '#components/PlayerCreatorModal/PlayerCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeletePlayer, queryPlayers } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Player } from '#shared/types/api/player';
import { shortUUID } from '#shared/utils';
import style from './PlayersDashboard.module.scss';

export const PlayersDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const players = createAsync(() => queryPlayers());

  const deletePlayer = useAction(actionDeletePlayer);
  const owner = getOwner();

  const handleCreatePlayer = () => {
    open({
      props: {
        component: PlayerCreatorModal,
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
      align: 'center',
    },
    {
      key: 'color',
      header: 'Color',
      align: 'center',
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditPlayer = useHandleButtonAction(
          async (player: Player) => {
            open({
              props: {
                component: PlayerCreatorModal,
                player,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Player Editor'),
        );

        return (
          <Show when={item.uuid}>
            <Button onPointerUp={() => handleEditPlayer(item)}>Edit</Button>
          </Show>
        );
      },
    },
    {
      key: 'delete',
      header: 'Delete',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleDeletePlayer = useHandleButtonAction(
          async (player: Player) => {
            await deletePlayer(player.uuid);

            actions.success(`Deleted player: ${player.name}`);
          },
          () => actions.error('Failed to delete player'),
        );

        return (
          <Button
            severity="danger"
            onPointerUp={() => handleDeletePlayer(item)}
            loading={handleDeletePlayer.loading()}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  return (
    <Widget class={style.container} topLeftLabels="Players Dashboard">
      <div class={style.league}>
        <Button onPointerUp={handleCreatePlayer}>Create Player</Button>
      </div>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={players()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};

export default PlayersDashboard;
