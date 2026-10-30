import { useAction } from '@solidjs/router';
import { batch, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { useConfirmModal } from '#components/ConfirmModal';
import { Paginator } from '#components/Paginator';
import { PlayerCreatorModal } from '#components/PlayerCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { actionDeletePlayer, queryPlayers } from '#flib/trpcCalls';
import { playersDashboardSearchState } from '#preloaders/PlayersDashboard';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { PermissionEnum } from '#shared/permissions';
import type { Player, PlayerQueryMeta } from '#shared/types/api/player';
import { shortUUID } from '#shared/utils';
import style from './PlayersDashboard.module.scss';

export const PlayersDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState(
    playersDashboardSearchState,
  );

  const players = createResilientAsync(queryMeta, queryPlayers);

  const deletePlayer = useAction(actionDeletePlayer);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();
  const can = useCan();

  const handleCreatePlayer = () => {
    open({
      props: {
        component: PlayerCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (sorting: NonNullable<PlayerQueryMeta['sorting']>) => {
    batch(() => {
      setQueryMeta('sorting', sorting);
      setQueryMeta('pagination', 'offset', 0);
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
            <Button
              disabled={!can(PermissionEnum.PLAYERS_UPDATE)}
              onClick={() => handleEditPlayer(item)}
            >
              Edit
            </Button>
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
            const confirmed = await openConfirmModal({
              title: 'Delete Player',
              message: 'Delete this player?',
              subject: player.name,
              confirmText: 'Delete',
              severity: 'danger',
            });

            if (!confirmed) return;

            await deletePlayer(player.uuid);

            actions.success(`Deleted player: ${player.name}`);
          },
          () => actions.error('Failed to delete player'),
        );

        return (
          <Button
            severity="danger"
            disabled={!can(PermissionEnum.PLAYERS_DELETE)}
            onClick={() => handleDeletePlayer(item)}
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
        <Show when={can(PermissionEnum.PLAYERS_CREATE)}>
          <Button onClick={handleCreatePlayer}>Create Player</Button>
        </Show>
      </div>

      <Paginator
        total={players.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
        setLimit={(limit) => setQueryMeta('pagination', { limit, offset: 0 })}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={players.latest?.data ?? []}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default PlayersDashboard;
