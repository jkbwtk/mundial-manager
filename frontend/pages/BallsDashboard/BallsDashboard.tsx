import { useAction } from '@solidjs/router';
import { batch, getOwner, Show } from 'solid-js';
import { BallCreatorModal } from '#components/BallCreatorModal';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { useConfirmModal } from '#components/ConfirmModal';
import { PAGINATOR_DEFAULT_LIMIT, Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { actionDeleteBall, queryBalls } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { PermissionEnum } from '#shared/permissions';
import { type Ball, BallQueryMeta } from '#shared/types/api/ball';
import { shortUUID } from '#shared/utils';
import style from './BallsDashboard.module.scss';

export const BallsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState({
    schema: BallQueryMeta.required({ pagination: true }),
    defaultState: {
      pagination: {
        limit: PAGINATOR_DEFAULT_LIMIT,
        offset: 0,
      },
    },
  });

  const balls = createResilientAsync(queryMeta, queryBalls);

  const deleteBall = useAction(actionDeleteBall);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();
  const can = useCan();

  const handleCreateBall = () => {
    open({
      props: {
        component: BallCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (sorting: NonNullable<BallQueryMeta['sorting']>) => {
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
      sortable: true,
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'diameter',
      header: 'Diameter',
      align: 'right',
      sortable: true,
      transform: (val) => (val ? `${val} mm` : '-'),
    },
    {
      key: 'weight',
      header: 'Weight',
      align: 'right',
      sortable: true,
      transform: (val) => (val ? `${val} g` : '-'),
    },
    {
      key: 'description',
      header: 'Description',
      align: 'center',
      sortable: true,
    },
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditBall = useHandleButtonAction(
          async (ball: Ball) => {
            open({
              props: {
                component: BallCreatorModal,
                ball,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Ball Editor'),
        );

        return (
          <Show when={item.uuid}>
            <Button
              disabled={!can(PermissionEnum.BALLS_UPDATE)}
              onPointerUp={() => handleEditBall(item)}
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
        const handleDeleteBall = useHandleButtonAction(
          async (ball: Ball) => {
            const confirmed = await openConfirmModal({
              title: 'Delete Ball',
              message: 'Delete this ball?',
              subject: ball.name,
              confirmText: 'Delete',
              severity: 'danger',
            });

            if (!confirmed) return;

            await deleteBall(ball.uuid);

            actions.success(`Deleted ball: ${ball.name}`);
          },
          () => actions.error('Failed to delete ball'),
        );

        return (
          <Button
            severity="danger"
            disabled={!can(PermissionEnum.BALLS_DELETE)}
            onPointerUp={() => handleDeleteBall(item)}
            loading={handleDeleteBall.loading()}
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
        <Show when={can(PermissionEnum.BALLS_CREATE)}>
          <Button onPointerUp={handleCreateBall}>Create Ball</Button>
        </Show>
      </div>

      <Paginator
        total={balls.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={balls.latest?.data ?? []}
          classic={false}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default BallsDashboard;
