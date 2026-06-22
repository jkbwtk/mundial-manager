import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateSeason, actionUpdateSeason } from '#flib/trpcCalls';
import {
  type Season,
  SeasonCreate,
  SeasonUpdate,
} from '#shared/types/api/season';
import style from './SeasonCreatorModal.module.scss';

export interface SeasonCreatorModalProps {
  season?: Season;
}

export const SeasonCreatorModal: Component<SeasonCreatorModalProps> = (
  props,
) => {
  const isCreating = props.season === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Season Creator',
        submitButtonText: 'Create',
        successMessage: 'Season created successfully!',
        errorMessage: 'Failed to create season. Please try again.',
        logLabel: 'Season creation error:',
      }
    : {
        title: 'Season Editor',
        submitButtonText: 'Update',
        successMessage: 'Season updated successfully!',
        errorMessage: 'Failed to update season. Please try again.',
        logLabel: 'Season update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.season}
      model={isCreating ? SeasonCreate : SeasonUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateSeason : actionUpdateSeason}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.season?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Season name...',
          type: 'text',
        },
        startDate: {
          label: 'Start Date',
          type: 'date',
        },
        endDate: {
          label: 'End Date',
          type: 'date',
        },
        config: {
          label: 'Config',
          type: 'text',
          hidden: true,
          implicitDefault: props.season?.config ?? {},
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.season?.labels ?? [],
        },
      }}
    />
  );
};
