import { Show } from 'solid-js';
import { ColorBlock } from '#components/ColorBlock';
import type { DropdownOption } from '#components/Dropdown';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import {
  actionCreateMatch,
  actionUpdateMatch,
  queryBallById,
  queryBalls,
  queryPlayerById,
  queryPlayers,
  queryTableById,
  queryTables,
} from '#flib/trpcCalls';
import {
  type Match,
  MatchCreate,
  MatchStatusEnum,
  MatchUpdate,
} from '#shared/types/api/match';
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
        },
        pauseDuration: {
          label: 'Pause Duration',
          type: 'number',
          placeholder: 'Pause duration...',
          unit: 's',
        },
        startDate: {
          label: 'Start Date',
          type: 'date',
        },
        side1Score: {
          label: 'Side 1 Score',
          type: 'number',
          placeholder: 'Side 1 score...',
        },
        side2Score: {
          label: 'Side 2 Score',
          type: 'number',
          placeholder: 'Side 2 score...',
        },
        status: {
          label: 'Status',
          type: 'dropdown',
          options: statusMap,
        },
        tableUuid: {
          label: 'Table',
          type: 'resourcePicker',
          placeholder: 'Select a table...',
          queryById: queryTableById,
          query: queryTables,
          toEntry: (e) => {
            return { label: e.name, value: e.uuid };
          },
        },
        ballUuid: {
          label: 'Ball',
          type: 'resourcePicker',
          queryById: queryBallById,
          query: queryBalls,
          placeholder: 'Select a ball...',
          toEntry: (e) => {
            return {
              label: (
                <>
                  {e.name}{' '}
                  <Show when={e.color}>
                    {(color) => (
                      <>
                        (<ColorBlock color={color()} width={2} />)
                      </>
                    )}
                  </Show>
                </>
              ),
              value: e.uuid,
            };
          },
        },
        playersSide1: {
          label: 'Side 1 Players',
          type: 'multiResourcePicker',
          queryById: queryPlayerById,
          query: queryPlayers,
          toEntry: (e) => {
            return { label: e.name, value: e.uuid };
          },
        },
        playersSide2: {
          label: 'Players Side 2',
          type: 'multiResourcePicker',
          queryById: queryPlayerById,
          query: queryPlayers,
          toEntry: (e) => {
            return { label: e.name, value: e.uuid };
          },
        },
        spectators: {
          label: 'Spectators',
          type: 'multiResourcePicker',
          queryById: queryPlayerById,
          query: queryPlayers,
          toEntry: (e) => {
            return { label: e.name, value: e.uuid };
          },
        },
      }}
    />
  );
};
