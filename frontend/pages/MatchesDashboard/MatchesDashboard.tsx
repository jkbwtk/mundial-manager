import { useAction } from '@solidjs/router';
import { batch, getOwner, Show } from 'solid-js';
import { AnchorButton, Button } from '#components/Button';
import { useConfirmModal } from '#components/ConfirmModal';
import { MatchCreatorModal } from '#components/MatchCreatorModal';
import { PAGINATOR_DEFAULT_LIMIT, Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createResilientAsync } from '#flib/resilientAsync';
import { useSearchParamsState } from '#flib/searchParamsState';
import { useHandleButtonAction } from '#flib/solidHelpers';
import { actionDeleteMatch, queryMatches } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatKnownStartDatetime } from '#shared/matchLabels';
import { PermissionEnum } from '#shared/permissions';
import { formatDurationMs } from '#shared/timeUtils';
import { type Match, MatchQueryMeta } from '#shared/types/api/match';
import { shortUUID } from '#shared/utils';
import style from './MatchesDashboard.module.scss';

export const MatchesDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [queryMeta, queryMetaState, setQueryMeta] = useSearchParamsState({
    schema: MatchQueryMeta.required({ pagination: true }),
    defaultState: {
      pagination: {
        limit: PAGINATOR_DEFAULT_LIMIT,
        offset: 0,
      },
      sorting: {
        direction: 'desc',
        field: 'startDate',
      },
    },
  });

  const matches = createResilientAsync(queryMeta, queryMatches);

  const deleteMatch = useAction(actionDeleteMatch);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();
  const can = useCan();

  const handleCreateMatch = () => {
    open({
      props: {
        component: MatchCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (sorting: NonNullable<MatchQueryMeta['sorting']>) => {
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
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      width: 12,
    },
    {
      key: 'score',
      header: 'Score',
      align: 'center',
      width: 7,
      transform: (_val, row: Match) => `${row.side1Score}:${row.side2Score}`,
    },
    {
      key: 'startDate',
      header: 'Start Date',
      align: 'center',
      sortable: true,
      width: 23,
      transform: (_val, row: Match) => formatKnownStartDatetime(row),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'center',
      sortable: true,
      width: 10,
      transform: (val) => formatDurationMs(val),
    },
    {
      key: 'pauseDuration',
      header: 'Pause Duration',
      align: 'center',
      sortable: true,
      width: 18,
      transform: (val) => formatDurationMs(val),
    },
    {
      key: 'spectators',
      header: 'Spectators',
      align: 'center',
      width: 12,
      transform: (val: string[]) => val.length,
    },
    {
      key: 'spacer',
      header: '',
      align: 'center',
      transform: () => '',
    },
    {
      key: 'events',
      header: 'Events',
      align: 'center',
      width: 10,
      transform: (_, item: Match) => {
        return (
          <AnchorButton
            severity="secondary"
            href={`/match-events/${item.uuid}`}
          >
            Events
          </AnchorButton>
        );
      },
    },
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditMatch = useHandleButtonAction(
          async (match: Match) => {
            open({
              props: {
                component: MatchCreatorModal,
                match,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Match Editor'),
        );

        return (
          <Show when={item.uuid}>
            <Button
              disabled={!can(PermissionEnum.MATCHES_UPDATE)}
              onPointerUp={() => handleEditMatch(item)}
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
        const handleDeleteMatch = useHandleButtonAction(
          async (match: Match) => {
            const confirmed = await openConfirmModal({
              title: 'Delete Match',
              message: 'Delete this match?',
              subject: shortUUID(match.uuid),
              confirmText: 'Delete',
              severity: 'danger',
            });

            if (!confirmed) return;

            await deleteMatch(match.uuid);

            actions.success(`Deleted match: ${shortUUID(match.uuid)}`);
          },
          () => actions.error('Failed to delete match'),
        );

        return (
          <Button
            severity="danger"
            disabled={!can(PermissionEnum.MATCHES_DELETE)}
            onPointerUp={() => handleDeleteMatch(item)}
            loading={handleDeleteMatch.loading()}
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
        <Show when={can(PermissionEnum.MATCHES_CREATE)}>
          <Button onPointerUp={handleCreateMatch}>Create Match</Button>
        </Show>
      </div>

      <Paginator
        total={matches.latest?.total ?? 0}
        limit={queryMetaState.pagination.limit}
        offset={queryMetaState.pagination.offset}
        setOffset={(offset) => setQueryMeta('pagination', 'offset', offset)}
      />

      <Divider />

      <div class={style.tableContainer}>
        <Table
          class={style.table}
          columns={column}
          data={matches.latest?.data ?? []}
          classic={false}
          sorting={queryMetaState.sorting}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default MatchesDashboard;
