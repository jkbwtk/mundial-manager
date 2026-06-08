import { useAction } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createUniqueId, Show } from 'solid-js';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { actionCreatePlayer, actionUpdatePlayer } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import 'highlight.js/styles/gml.min.css';
import { autofocus } from '#flib/solidHelpers';
import { type Player, PlayerCreate } from '#shared/types/api/player';
import style from './PlayerCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface PlayerCreatorModalProps {
  player?: Player;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const PlayerCreatorModal: Component<PlayerCreatorModalProps> = (
  props,
) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.player === undefined;

  const config: CreatorState = isCreating
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

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    PlayerCreate,
    {
      updateMode: !isCreating,
      implicitDefaults: {
        labels: [],
      },
    },
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleError = (err: unknown) => {
    actions.error(config.errorMessage);
    console.error(config.logLabel, err);
  };

  const handleSuccess = (player: Player) => {
    actions.success(config.successMessage);
    closeModal(player);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreatePlayer);
  const updateAction = useAction(actionUpdatePlayer);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Player Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: PlayerCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.player!.uuid,
      ...data,
    });
  };

  const handleSubmit = formSubmit(action, handleSuccess, handleError);

  return (
    <Modal
      class={style.modal}
      topLeftLabels={config.title}
      bottomLeftLabels={[
        <Button severity="secondary" onPointerUp={handleCancel}>
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button
          type="submit"
          form={formId}
          loading={handleSubmit.isSubmitting()}
          disabled={!canSubmit()}
        >
          {config.submitButtonText}
        </Button>,
      ]}
    >
      <form id={formId} class={style.form} onSubmit={handleSubmit}>
        <div class={style.fieldsContainer}>
          <span class={style.fieldLabel}>Name:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Player name"
            maxLength={255}
            required
            name="name"
            value={props.player?.name ?? ''}
            useDirectives={[validate, autofocus]}
            invalid={!!errors.name}
          />

          <span class={style.fieldLabel}>Alias:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Player alias"
            maxLength={255}
            required
            name="alias"
            value={props.player?.alias ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.alias}
          />

          <span class={style.fieldLabel}>Color:</span>
          <Input
            class={style.fieldInput}
            type="color"
            placeholder="Player color"
            maxLength={255}
            required
            name="color"
            value={props.player?.color ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.color}
          />
        </div>

        <Divider class={style.divider} />

        <div class={style.hintRow}>
          <Show
            when={hasValidationErrors()}
            fallback={<span class={style.noErrors}>No validation errors</span>}
          >
            <HighlightedCode
              language="json"
              code={`Errors: ${toJson(errors)}`}
            />
          </Show>
        </div>
      </form>
    </Modal>
  );
};
