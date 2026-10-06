import { useAction } from '@solidjs/router';
import { batch, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { PAGINATOR_DEFAULT_LIMIT, Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { TableCreatorModal } from '#components/TableCreatorModal';
import { Divider } from '#components/Widget';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { actionDeleteTable, queryTables } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import {
  TableQueryMeta,
  type Table as TableType,
} from '#shared/types/api/table';
import { shortUUID } from '#shared/utils';
import style from './TablesDashboard.module.scss';

export const TablesDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState({
    schema: TableQueryMeta.required({ pagination: true }),
    defaultState: {
      pagination: {
        limit: PAGINATOR_DEFAULT_LIMIT,
        offset: 0,
      },
    },
  });

  const tables = createResilientAsync(queryMeta, queryTables);

  const deleteTable = useAction(actionDeleteTable);
  const owner = getOwner();

  const handleCreateTable = () => {
    open({
      props: {
        component: TableCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (sorting: NonNullable<TableQueryMeta['sorting']>) => {
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
      key: 'side1Color',
      header: 'Side 1 Color',
      align: 'center',
      width: 14,
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'side2Color',
      header: 'Side 2 Color',
      align: 'center',
      width: 14,
      transform: (val) => <ColorBlock color={val} />,
    },
    {
      key: 'location',
      header: 'Location',
      align: 'center',
      sortable: true,
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
        const handleEditTable = useHandleButtonAction(
          async (table: TableType) => {
            open({
              props: {
                component: TableCreatorModal,
                table,
              },
              owner,
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
    <div class={style.outerContainer}>
      <div class={style.controls}>
        <Button onPointerUp={handleCreateTable}>Create Table</Button>
      </div>

      <Paginator
        total={tables.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={tables.latest?.data ?? []}
          classic={false}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default TablesDashboard;
