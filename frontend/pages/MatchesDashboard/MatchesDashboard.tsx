import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchCreatorModal } from '#components/MatchCreatorModal/MatchCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/index';
import { actionDeleteMatch, queryMatches } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type { Match } from '#shared/types/api/match';
import { shortUUID } from '#shared/utils';
import style from './MatchesDashboard.module.scss';

export const MatchesDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const matches = createAsync(() => queryMatches());

  const deleteMatch = useAction(actionDeleteMatch);
  const owner = getOwner();

  const handleCreateMatch = () => {
    open({
      props: {
        component: MatchCreatorModal,
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
      key: 'status',
      header: 'Status',
      align: 'center',
    },
    {
      key: 'startDate',
      header: 'Start Date',
      align: 'center',
      transform: (val: Date) => formatDate(val.getTime() / 1000),
    },
    {
      key: 'duration',
      header: 'Duration',
      align: 'center',
      transform: (val) => formatDuration(val),
    },
    {
      key: 'pauseDuration',
      header: 'Pause Duration',
      align: 'center',
      transform: (val) => formatDuration(val),
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
                owner,
                match,
              },
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
    <Widget class={style.container} topLeftLabels="Matches Dashboard">
      <div class={style.league}>
        <Button onPointerUp={handleCreateMatch}>Create Match</Button>
      </div>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={matches()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};

export default MatchesDashboard;
