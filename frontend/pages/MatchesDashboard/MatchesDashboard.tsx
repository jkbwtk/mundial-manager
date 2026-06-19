import { createAsync, useAction } from '@solidjs/router';
import { createSignal, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchCreatorModal } from '#components/MatchCreatorModal/MatchCreatorModal';
import { Paginator } from '#components/Paginator';
import { type Column, Table } from '#components/Table';
import { Divider } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import {
  actionDeleteMatch,
  queryMatchEventsByMatchId,
  queryMatches,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type { Match, MatchQueryMeta } from '#shared/types/api/match';
import { shortUUID } from '#shared/utils';
import style from './MatchesDashboard.module.scss';

export const MatchesDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();

  const [limit, setLimit] = createSignal(50);
  const [page, setPage] = createSignal(0);
  const [sorting, setSorting] = createSignal<MatchQueryMeta['sorting']>({
    direction: 'asc',
    field: 'startDate',
  });

  const queryMetaProp = (): MatchQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    sorting: sorting(),
  });

  const matches = createAsync(() => queryMatches(queryMetaProp()));

  const deleteMatch = useAction(actionDeleteMatch);
  const owner = getOwner();

  const handleCreateMatch = () => {
    open({
      props: {
        component: MatchCreatorModal,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleOnSort = (field: string, direction: 'asc' | 'desc') => {
    setSorting({
      field: field as NonNullable<MatchQueryMeta['sorting']>['field'],
      direction,
    });
  };

  const handleFetchEvents = async (matchUuid: string) => {
    const events = await queryMatchEventsByMatchId(matchUuid);

    console.log(events);
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
      width: 14,
      transform: (val: Date) => formatDate(val.getTime() / 1000),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'center',
      sortable: true,
      width: 10,
      transform: (val) => formatDuration(val),
    },
    {
      key: 'pauseDuration',
      header: 'Pause Duration',
      align: 'center',
      sortable: true,
      width: 18,
      transform: (val) => formatDuration(val),
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
          <Show when={item.uuid}>
            <Button
              severity="secondary"
              onClick={() => handleFetchEvents(item.uuid)}
            >
              Events
            </Button>
          </Show>
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
            <Button onPointerUp={() => handleEditMatch(item)}>Edit</Button>
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
            await deleteMatch(match.uuid);

            actions.success(`Deleted match: ${shortUUID(match.uuid)}`);
          },
          () => actions.error('Failed to delete match'),
        );

        return (
          <Button
            severity="danger"
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
        <Button onPointerUp={handleCreateMatch}>Create Match</Button>
      </div>

      <Paginator
        total={matches.latest?.total ?? 0}
        limit={limit()}
        setLimit={setLimit}
        page={page()}
        setPage={setPage}
      />

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={matches.latest?.data ?? []}
          classic={false}
          onSort={handleOnSort}
        />
      </div>
    </div>
  );
};

export default MatchesDashboard;
