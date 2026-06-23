import { createAsync, useAction } from '@solidjs/router';
import { createSignal, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { Paginator } from '#components/Paginator';
import { PlayerCreatorModal } from '#components/PlayerCreatorModal/PlayerCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeletePlayer, queryPlayers } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Player, PlayerQueryMeta } from '#shared/types/api/player';
import { shortUUID } from '#shared/utils';
import style from './PlayersDashboard.module.scss';

export const PlayersDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [sorting, setSorting] = createSignal<PlayerQueryMeta['sorting']>();

  const queryMetaProp = (): PlayerQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    sorting: sorting(),
  });

  const players = createAsync(() => queryPlayers(queryMetaProp()));

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

  const handleOnSort = (field: string, direction: 'asc' | 'desc') => {
    setSorting({
      field: field as NonNullable<PlayerQueryMeta['sorting']>['field'],
      direction,
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
      sortable: true,
    },
    {
      key: 'alias',
      header: 'Alias',
      align: 'center',
      sortable: true,
    },
    {
      key: 'color',
      header: 'Color',
      align: 'center',
      width: 12,
      sortable: true,
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
    <div class={style.outerContainer}>
      <div class={style.controls}>
        <Button onPointerUp={handleCreatePlayer}>Create Player</Button>
      </div>

      <Paginator
        total={players.latest?.total ?? 0}
        limit={limit()}
        setLimit={setLimit}
        page={page()}
        setPage={setPage}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={players.latest?.data ?? []}
          classic={false}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default PlayersDashboard;
