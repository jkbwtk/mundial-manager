import { ModalForm, type ModalFormLabels } from '#components/ModalForm';
import { actionCreatePlayer, actionUpdatePlayer } from '#flib/trpcCalls';
import {
  type Player,
  PlayerCreate,
  PlayerUpdate,
} from '#shared/types/api/player';
import style from './PlayerCreatorModal.module.scss';

export interface PlayerCreatorModalProps {
  player?: Player;
}

export const PlayerCreatorModal: Component<PlayerCreatorModalProps> = (
  props,
) => {
  const isCreating = props.player === undefined;

  const config: ModalFormLabels = isCreating
    ? {
        title: 'Player Creator',
        submitButtonText: 'Create',
        successMessage: 'Player created successfully!',
        errorMessage: 'Failed to create player. Please try again.',
        logLabel: 'Player creation error:',
      }
    : {
        title: 'Player Editor',
        submitButtonText: 'Update',
        successMessage: 'Player updated successfully!',
        errorMessage: 'Failed to update player. Please try again.',
        logLabel: 'Player update error:',
      };

  return (
    <ModalForm
      class={style.modal}
      instance={props.player}
      model={isCreating ? PlayerCreate : PlayerUpdate}
      // @ts-expect-error
      action={isCreating ? actionCreatePlayer : actionUpdatePlayer}
      {...config}
      fields={{
        uuid: {
          label: 'UUID',
          type: 'text',
          hidden: true,
          implicitDefault: props.player?.uuid,
        },
        name: {
          label: 'Name',
          placeholder: 'Player name...',
          type: 'text',
        },
        alias: {
          label: 'Alias',
          placeholder: 'Player alias...',
          type: 'text',
        },
        color: {
          label: 'Color',
          type: 'color',
        },
        labels: {
          label: 'Labels',
          type: 'text',
          hidden: true,
          implicitDefault: props.player?.labels ?? {},
        },
      }}
    />
  );
};
