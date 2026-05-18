import { createAsync, useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { SeasonCreatorModal } from '#components/SeasonCreatorModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionDeleteSeason,
  queryActiveLeague,
  queryCurrentSeason,
  querySeasons,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { Season } from '#shared/types/api/season';
import { shortUUID } from '#shared/utils';
import style from './SeasonsDashboard.module.scss';

export const SeasonsDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const activeLeague = createAsync(() => queryActiveLeague());
  const seasons = createAsync(() => querySeasons());
  const currentSeason = createAsync(() => queryCurrentSeason());

  const deleteSeason = useAction(actionDeleteSeason);
  const owner = getOwner();

  const handleCreateSeason = () => {
    open({
      props: {
        component: SeasonCreatorModal,
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
      key: 'startDate',
      header: 'Start Date',
      align: 'center',
    },
    {
      key: 'endDate',
      header: 'End Date',
      align: 'center',
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
                owner,
                season,
              },
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
    <Widget class={style.container} topLeftLabels="Seasons Dashboard">
      <div class={style.league}>
        <span>Current Season:</span>
        <Show
          when={currentSeason()}
          fallback={<span class={style.noDescription}>None</span>}
        >
          {currentSeason()!.name}
        </Show>
      </div>

      <div class={style.league}>
        <Button onPointerUp={handleCreateSeason} disabled={!activeLeague()}>
          Create Season
        </Button>
      </div>

      <Divider />

      <div class={style.leaguesTableContainer}>
        <Table
          class={style.leaguesTable}
          columns={column}
          data={seasons()?.data ?? []}
          classic={false}
        />
      </div>
    </Widget>
  );
};
export default SeasonsDashboard;
