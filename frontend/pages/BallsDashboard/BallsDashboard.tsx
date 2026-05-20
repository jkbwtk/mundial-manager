import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { BallCreatorModal } from '#components/BallCreatorModal/BallCreatorModal';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeleteBall, queryBalls } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Ball } from '#shared/types/api/ball';
import { shortUUID } from '#shared/utils';
import style from './BallsDashboard.module.scss';

export const BallsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const balls = createAsync(() => queryBalls());

  const deleteBall = useAction(actionDeleteBall);
  const owner = getOwner();

  const handleCreateBall = () => {
    open({
      props: {
        component: BallCreatorModal,
        owner,
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
      align: 'center',
    },
    {
      key: 'color',
      header: 'Color',
      align: 'center',
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'diameter',
      header: 'Diameter',
      align: 'right',
      transform: (val) => `${val} mm`,
    },
    {
      key: 'weight',
      header: 'Weight',
      align: 'right',
      transform: (val) => `${val} g`,
    },
    {
      key: 'description',
      header: 'Description',
      align: 'center',
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
                owner,
                ball,
              },
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
    <Widget class={style.container} topLeftLabels="Balls Dashboard">
      <div class={style.league}>
        <Button onPointerUp={handleCreateBall}>Create Ball</Button>
      </div>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={balls()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};

export default BallsDashboard;
