import {
  type League,
  LeagueCreate,
  LeagueUpdate,
} from '#shared/types/api/league';
import 'highlight.js/styles/gml.min.css';
import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreateLeague, actionUpdateLeague } from '#flib/trpcCalls';
import style from './LeagueCreatorModal.module.scss';
export interface LeagueCreatorModalProps {
  league?: League;
}

export const LeagueCreatorModal: Component<LeagueCreatorModalProps> = (
  props,
) => {
  const isCreating = props.league === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'League Creator',
        submitButtonText: 'Create',
        successMessage: 'League created successfully!',
        errorMessage: 'Failed to create league. Please try again.',
        logLabel: 'League creation error:',
      }
    : {
        title: 'League Editor',
        submitButtonText: 'Update',
        successMessage: 'League updated successfully!',
        errorMessage: 'Failed to update league. Please try again.',
        logLabel: 'League update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.league}
      model={isCreating ? LeagueCreate : LeagueUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreateLeague : actionUpdateLeague}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.league?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'League name...',
          type: 'text',
        },
        alias: {
          label: 'Alias',
          placeholder: 'League alias...',
          type: 'text',
        },
        description: {
          label: 'Description',
          placeholder: 'League description...',
          type: 'textArea',
        },
      }}
    />
  );
};
