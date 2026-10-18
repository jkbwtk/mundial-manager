import { useAction } from '@solidjs/router';
import { getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { useConfirmModal } from '#components/ConfirmModal';
import { GoalTypeCreatorModal } from '#components/GoalTypeCreatorModal';
import { LeagueSettingsModal } from '#components/LeagueSettingsModal';
import { type Column, Table } from '#components/Table';
import { Divider, Widget } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createResilientAsync } from '#flib/resilientAsync';
import { useHandleButtonAction } from '#flib/solidHelpers';
import {
  actionDeleteGoalType,
  queryActiveLeague,
  queryGoalTypes,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { formatGoalTypeLabel, sortGoalTypeTree } from '#shared/goalTypes';
import { PermissionEnum } from '#shared/permissions';
import type { GoalType } from '#shared/types/api/goalType';
import { League } from '#shared/types/api/league';
import { shortUUID } from '#shared/utils';
import style from './LeagueDashboard.module.scss';

export const LeagueDashboard: Component = () => {
  const [, actions] = useToast();
  const [, { open }] = useModal();
  const can = useCan();

  const league = createResilientAsync(queryActiveLeague);
  const goalTypes = createResilientAsync(queryGoalTypes);

  const deleteGoalType = useAction(actionDeleteGoalType);
  const openConfirmModal = useConfirmModal();
  const owner = getOwner();

  const sortedGoalTypes = () => sortGoalTypeTree(goalTypes.latest?.data ?? []);

  const handleEditLeague = () => {
    const current = League.safeParse(league());

    if (!current.success) return;

    open({
      props: {
        component: LeagueSettingsModal,
        league: current.data,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleCreateGoalType = () => {
    open({
      props: {
        component: GoalTypeCreatorModal,
      },
      owner,
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
      transform: (_, item: GoalType) =>
        `${item.parentUuid ? '↳ ' : ''}${formatGoalTypeLabel(item)}`,
    },
    {
      key: 'key',
      header: 'Key',
      align: 'left',
    },
    {
      key: 'color',
      header: 'Color',
      align: 'center',
      transform: (val) => (val ? <ColorBlock color={val} /> : '-'),
    },
    {
      key: 'stylePoints',
      header: 'Style',
      align: 'right',
    },
    {
      key: 'description',
      header: 'Description',
      align: 'left',
      minWidth: 30,
      transform: (val) => val ?? '-',
    },
    {
      key: 'edit',
      header: 'Edit',
      align: 'center',
      width: 10,
      transform: (_, item) => {
        const handleEditGoalType = useHandleButtonAction(
          async (goalType: GoalType) => {
            open({
              props: {
                component: GoalTypeCreatorModal,
                goalType,
              },
              owner,
              closeOnBackgroundClick: false,
            });
          },
          () => actions.error('Failed to open Goal Type Editor'),
        );

        return (
          <Button
            severity="secondary"
            disabled={!can(PermissionEnum.GOAL_TYPES_UPDATE)}
            onClick={() => handleEditGoalType(item)}
            loading={handleEditGoalType.loading()}
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
        const handleDeleteGoalType = useHandleButtonAction(
          async (goalType: GoalType) => {
            const confirmed = await openConfirmModal({
              title: 'Delete Goal Type',
              message: 'Delete this goal type?',
              subject: goalType.name,
              confirmText: 'Delete',
              severity: 'danger',
            });

            if (!confirmed) return;

            await deleteGoalType(goalType.uuid);

            actions.success(`Deleted goal type: ${goalType.name}`);
          },
          () => actions.error('Failed to delete goal type'),
        );

        return (
          <Button
            severity="danger"
            disabled={!can(PermissionEnum.GOAL_TYPES_DELETE)}
            onClick={() => handleDeleteGoalType(item)}
            loading={handleDeleteGoalType.loading()}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  return (
    <div class={style.container}>
      <Widget topLeftLabels="League">
        <Show when={league()}>
          {(current) => (
            <div class={style.details}>
              <span>Name:</span>
              <strong>{current().name}</strong>

              <span>Alias:</span>
              <strong>{current().alias}</strong>

              <span>Timezone:</span>
              <strong>{current().timezone}</strong>

              <span>Description:</span>
              <Show
                when={current().description}
                fallback={
                  <strong class={style.noDescription}>No description</strong>
                }
              >
                {(description) => <strong>{description()}</strong>}
              </Show>
            </div>
          )}
        </Show>

        <Show when={can(PermissionEnum.LEAGUE_SETTINGS_UPDATE)}>
          <Button onClick={handleEditLeague}>Edit League</Button>
        </Show>
      </Widget>

      <Widget topLeftLabels="Goal Types">
        <Show when={can(PermissionEnum.GOAL_TYPES_CREATE)}>
          <Button onClick={handleCreateGoalType}>Create Goal Type</Button>
        </Show>

        <Divider />

        <div class={style.tableContainer}>
          <Table
            class={style.table}
            columns={column}
            data={sortedGoalTypes()}
          />
        </div>
      </Widget>
    </div>
  );
};

export default LeagueDashboard;
