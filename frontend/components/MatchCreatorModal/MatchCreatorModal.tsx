import { BallLabel } from '#components/BallLabel';
import type { DropdownOption } from '#components/Dropdown';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { TableLabel } from '#components/TableLabel';
import {
  actionCreateMatch,
  actionUpdateMatch,
  queryBalls,
  queryBallsByIds,
  queryPlayers,
  queryPlayersByIds,
  queryTables,
  queryTablesByIds,
} from '#flib/trpcCalls';
import { msToSeconds, secondsToMs } from '#shared/timeUtils';
import type { Ball } from '#shared/types/api/ball';
import {
  type Match,
  MatchCreate,
  MatchStatusEnum,
  MatchUpdate,
} from '#shared/types/api/match';
import type { Player } from '#shared/types/api/player';
import type { Table } from '#shared/types/api/table';
import style from './MatchCreatorModal.module.scss';

export interface MatchCreatorModalProps {
  match?: Match;
}

export const MatchCreatorModal: Component<MatchCreatorModalProps> = (props) => {
  const isCreating = props.match === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Match Creator',
        submitButtonText: 'Create',
        successMessage: 'Match created successfully!',
        errorMessage: 'Failed to create match. Please try again.',
        logLabel: 'Match creation error:',
      }
    : {
        title: 'Match Editor',
        submitButtonText: 'Update',
        successMessage: 'Match updated successfully!',
        errorMessage: 'Failed to update match. Please try again.',
        logLabel: 'Match update error:',
      };

  const statusMap: DropdownOption[] = Object.values(MatchStatusEnum).map(
    (status) => ({
      label: status,
      value: status,
    }),
  );

  return (
    <ModalForm
      class={style.modal}
      instance={props.match}
      model={isCreating ? MatchCreate : MatchUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateMatch : actionUpdateMatch}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.match?.uuid,
        },
        duration: {
          label: 'Duration',
          type: 'number',
          placeholder: 'Match duration...',
          unit: 's',
          min: 0,
          transform: secondsToMs,
          format: msToSeconds,
        },
        pauseDuration: {
          label: 'Pause Duration',
          type: 'number',
          placeholder: 'Pause duration...',
          unit: 's',
          min: 0,
          transform: secondsToMs,
          format: msToSeconds,
        },
        startDate: {
          label: 'Start Date',
          type: 'date',
          dateMode: 'dateTimeSeconds',
        },
        side1Score: {
          label: 'Side 1 Score',
          type: 'number',
          placeholder: 'Side 1 score...',
          step: 1,
          min: 0,
        },
        side2Score: {
          label: 'Side 2 Score',
          type: 'number',
          placeholder: 'Side 2 score...',
          step: 1,
          min: 0,
        },
        status: {
          label: 'Status',
          type: 'dropdown',
          // Overwritten by the lifecycle derived from a stored timeline
          options: statusMap,
        },
        hidden: {
          label: 'Hidden',
          type: 'checkbox',
        },
        tableUuid: {
          label: 'Table',
          type: 'resourcePicker',
          placeholder: 'Select a table...',
          queryByIds: queryTablesByIds,
          query: queryTables,
          toEntry: (e: Table) => {
            return { label: <TableLabel table={e} />, value: e.uuid };
          },
        },
        ballUuid: {
          label: 'Ball',
          type: 'resourcePicker',
          queryByIds: queryBallsByIds,
          query: queryBalls,
          placeholder: 'Select a ball...',
          toEntry: (e: Ball) => {
            return { label: <BallLabel ball={e} />, value: e.uuid };
          },
        },
        playersSide1: {
          label: 'Side 1 Players',
          type: 'multiResourcePicker',
          queryByIds: queryPlayersByIds,
          query: queryPlayers,
          toEntry: (e: Player) => {
            return { label: e.name, value: e.uuid };
          },
        },
        playersSide2: {
          label: 'Players Side 2',
          type: 'multiResourcePicker',
          queryByIds: queryPlayersByIds,
          query: queryPlayers,
          toEntry: (e: Player) => {
            return { label: e.name, value: e.uuid };
          },
        },
        spectators: {
          label: 'Spectators',
          type: 'multiResourcePicker',
          queryByIds: queryPlayersByIds,
          query: queryPlayers,
          toEntry: (e: Player) => {
            return { label: e.name, value: e.uuid };
          },
        },
        labels: {
          label: 'Labels',
          type: 'record',
          hidden: false,
          implicitDefault: props.match?.labels ?? {},
          keyPlaceholder: 'Label...',
          valuePlaceholder: 'Value...',
        },
      }}
    />
  );
};
