import { useAction } from '@solidjs/router';
import { batch, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { useConfirmModal } from '#components/ConfirmModal';
import { PAGINATOR_DEFAULT_LIMIT, Paginator } from '#components/Paginator';
import { SeasonCreatorModal } from '#components/SeasonCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionDeleteSeason,
  queryCurrentSeason,
  querySeasons,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { PermissionEnum } from '#shared/permissions';
import { formatDate } from '#shared/timeUtils';
import { type Season, SeasonQueryMeta } from '#shared/types/api/season';
import { shortUUID } from '#shared/utils';
import style from './SeasonsDashboard.module.scss';

export const SeasonsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState({
    schema: SeasonQueryMeta.required({ pagination: true }),
    defaultState: {
      pagination: {
        limit: PAGINATOR_DEFAULT_LIMIT,
        offset: 0,
      },
      sorting: {
        direction: 'asc',
        field: 'startDate',
      },
    },
  });

  const seasons = createResilientAsync(queryMeta, querySeasons);
  const currentSeason = createResilientAsync(queryCurrentSeason);

  const deleteSeason = useAction(actionDeleteSeason);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();
  const can = useCan();

  const handleCreateSeason = () => {
    open({
      props: {
        component: SeasonCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (sorting: NonNullable<SeasonQueryMeta['sorting']>) => {
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
            disabled={!can(PermissionEnum.SEASONS_UPDATE)}
            onClick={() => handleEditSeason(item)}
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
            const confirmed = await openConfirmModal({
              title: 'Delete Season',
              message: 'Delete this season?',
              subject: season.name,
              confirmText: 'Delete',
              severity: 'danger',
            });

            if (!confirmed) return;

            await deleteSeason(season.uuid);

            actions.success(`Deleted season: ${season.name}`);
          },
          () => actions.error('Failed to delete season'),
        );

        return (
          <Button
            severity="danger"
            disabled={!can(PermissionEnum.SEASONS_DELETE)}
            onClick={() => handleDeleteSeason(item)}
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

        <Show when={can(PermissionEnum.SEASONS_CREATE)}>
          <Button onClick={handleCreateSeason}>Create Season</Button>
        </Show>
      </div>

      <Paginator
        total={seasons.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={seasons.latest?.data ?? []}
          classic={false}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};
export default SeasonsDashboard;
