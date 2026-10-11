import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import {
  actionCreateGoalType,
  actionUpdateGoalType,
  queryGoalTypes,
  queryGoalTypesByIds,
} from '#flib/trpcCalls';
import { formatGoalTypeLabel } from '#shared/goalTypes';
import {
  type GoalType,
  GoalTypeCreate,
  GoalTypeUpdate,
} from '#shared/types/api/goalType';
import style from './GoalTypeCreatorModal.module.scss';

export interface GoalTypeCreatorModalProps {
  goalType?: GoalType;
}

function formatGoalTypeKey(key: string | undefined): string | undefined {
  return key?.toUpperCase().replaceAll(/[^A-Z0-9]+/g, '_');
}

export const GoalTypeCreatorModal: Component<GoalTypeCreatorModalProps> = (
  props,
) => {
  const isCreating = props.goalType === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Goal Type Creator',
        submitButtonText: 'Create',
        successMessage: 'Goal type created successfully!',
        errorMessage: 'Failed to create goal type. Please try again.',
        logLabel: 'Goal type creation error:',
      }
    : {
        title: 'Goal Type Editor',
        submitButtonText: 'Update',
        successMessage: 'Goal type updated successfully!',
        errorMessage: 'Failed to update goal type. Please try again.',
        logLabel: 'Goal type update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.goalType}
      model={isCreating ? GoalTypeCreate : GoalTypeUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateGoalType : actionUpdateGoalType}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.goalType?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Goal type name...',
          type: 'text',
        },
        key: {
          label: 'Key',
          placeholder: 'GOAL_TYPE_KEY...',
          type: 'text',
          transform: formatGoalTypeKey,
        },
        parentUuid: {
          label: 'Parent',
          type: 'resourcePicker',
          placeholder: 'Select a parent goal type...',
          queryByIds: queryGoalTypesByIds,
          query: queryGoalTypes,
          toEntry: (goalType: GoalType) => ({
            label: formatGoalTypeLabel(goalType),
            value: goalType.uuid,
          }),
        },
        icon: {
          label: 'Icon',
          placeholder: 'Emoji...',
          type: 'text',
        },
        color: {
          label: 'Color',
          type: 'color',
        },
        stylePoints: {
          label: 'Style points',
          placeholder: 'Style points...',
          type: 'number',
          min: 0,
        },
        description: {
          label: 'Description',
          placeholder: 'Goal type description...',
          type: 'textArea',
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.goalType?.labels ?? {},
        },
      }}
    />
  );
};
