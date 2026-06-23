import { createAsync, useAction } from '@solidjs/router';
import { createSignal, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { Paginator } from '#components/Paginator';
import { SeasonCreatorModal } from '#components/SeasonCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionDeleteSeason,
  queryCurrentSeason,
  querySeasons,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatDate } from '#shared/timeUtils';
import type { Season, SeasonQueryMeta } from '#shared/types/api/season';
import { shortUUID } from '#shared/utils';
import style from './SeasonsDashboard.module.scss';

export const SeasonsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [sorting, setSorting] = createSignal<SeasonQueryMeta['sorting']>({
    direction: 'asc',
    field: 'startDate',
  });

  const queryMetaProp = (): SeasonQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    sorting: sorting(),
  });

  const seasons = createAsync(() => querySeasons(queryMetaProp()));
  const currentSeason = createAsync(() => queryCurrentSeason());

  const deleteSeason = useAction(actionDeleteSeason);
  const owner = getOwner();

  const handleCreateSeason = () => {
    open({
      props: {
        component: SeasonCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (field: string, direction: 'asc' | 'desc') => {
    setSorting({
      field: field as NonNullable<SeasonQueryMeta['sorting']>['field'],
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
      key: 'startDate',
      header: 'Start Date',
      align: 'center',
      width: 14,
      sortable: true,
      transform: (val: Date) => formatDate(val.getTime() / 1000),
    },
    {
      key: 'endDate',
      header: 'End Date',
      align: 'center',
      width: 14,
      sortable: true,
      transform: (val: Date) => formatDate(val.getTime() / 1000),
    },
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditSeason = useHandleButtonAction(
          async (season: Season) => {
            open({
              props: {
                component: SeasonCreatorModal,
                season,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Season Editor'),
        );

        return (
          <Button
            severity="secondary"
            onPointerUp={() => handleEditSeason(item)}
            loading={handleEditSeason.loading()}
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
        const handleDeleteSeason = useHandleButtonAction(
          async (season: Season) => {
            await deleteSeason(season.uuid);

            actions.success(`Deleted season: ${season.name}`);
          },
          () => actions.error('Failed to delete season'),
        );

        return (
          <Button
            severity="danger"
            onPointerUp={() => handleDeleteSeason(item)}
            loading={handleDeleteSeason.loading()}
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
        <div>
          <span>Current Season: </span>
          <Show
            when={currentSeason()}
            fallback={<span class={style.noDescription}>None</span>}
          >
            {currentSeason()!.name}
          </Show>
        </div>

        <Button onPointerUp={handleCreateSeason}>Create Season</Button>
      </div>

      <Paginator
        total={seasons.latest?.total ?? 0}
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
          data={seasons.latest?.data ?? []}
          classic={false}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};
export default SeasonsDashboard;
