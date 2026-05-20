import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { type Column, Table } from '#components/Table';
import { TableCreatorModal } from '#components/TableCreatorModal/TableCreatorModal';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeleteTable, queryTables } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Table as TableType } from '#shared/types/api/table';
import { shortUUID } from '#shared/utils';
import style from './TablesDashboard.module.scss';

export const TablesDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const tables = createAsync(() => queryTables());

  const deleteTable = useAction(actionDeleteTable);
  const owner = getOwner();

  const handleCreateSeason = () => {
    open({
      props: {
        component: TableCreatorModal,
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
      key: 'side1Color',
      header: 'Side 1 Color',
      align: 'center',
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'side2Color',
      header: 'Side 2 Color',
      align: 'center',
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'location',
      header: 'Location',
      align: 'center',
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
        const handleEditTable = useHandleButtonAction(
          async (table: TableType) => {
            open({
              props: {
                component: TableCreatorModal,
                owner,
                table,
              },
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Table Editor'),
        );

        return (
          <Show when={item.uuid}>
            <Button onPointerUp={() => handleEditTable(item)}>Edit</Button>
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
        const handleDeleteTable = useHandleButtonAction(
          async (table: TableType) => {
            await deleteTable(table.uuid);

            actions.success(`Deleted table: ${table.name}`);
          },
          () => actions.error('Failed to delete table'),
        );

        return (
          <Button
            severity="danger"
            onPointerUp={() => handleDeleteTable(item)}
            loading={handleDeleteTable.loading()}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  return (
    <Widget class={style.container} topLeftLabels="Tables Dashboard">
      <div class={style.league}>
        <Button onPointerUp={handleCreateSeason}>Create Season</Button>
      </div>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={tables()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};

export default TablesDashboard;
