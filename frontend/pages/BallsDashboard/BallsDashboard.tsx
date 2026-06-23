import { createAsync, useAction } from '@solidjs/router';
import { createSignal, getOwner, Show } from 'solid-js';
import { BallCreatorModal } from '#components/BallCreatorModal/BallCreatorModal';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeleteBall, queryBalls } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Ball, BallQueryMeta } from '#shared/types/api/ball';
import { shortUUID } from '#shared/utils';
import style from './BallsDashboard.module.scss';

export const BallsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [sorting, setSorting] = createSignal<BallQueryMeta['sorting']>();

  const queryMetaProp = (): BallQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    sorting: sorting(),
  });

  const balls = createAsync(() => queryBalls(queryMetaProp()));

  const deleteBall = useAction(actionDeleteBall);
  const owner = getOwner();

  const handleCreateBall = () => {
    open({
      props: {
        component: BallCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (field: string, direction: 'asc' | 'desc') => {
    setSorting({
      field: field as NonNullable<BallQueryMeta['sorting']>['field'],
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
            <Button onPointerUp={() => handleEditBall(item)}>Edit</Button>
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
            await deleteBall(ball.uuid);

            actions.success(`Deleted ball: ${ball.name}`);
          },
          () => actions.error('Failed to delete ball'),
        );

        return (
          <Button
            severity="danger"
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
        <Button onPointerUp={handleCreateBall}>Create Ball</Button>
      </div>

      <Paginator
        total={balls.latest?.total ?? 0}
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
          data={balls.latest?.data ?? []}
          classic={false}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default BallsDashboard;
