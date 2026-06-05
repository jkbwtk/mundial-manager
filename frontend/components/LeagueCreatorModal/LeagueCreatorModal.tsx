import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createUniqueId, Show } from 'solid-js';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { type League, LeagueCreate } from '#shared/types/api/league';
import 'highlight.js/styles/gml.min.css';
import { useAction } from '@solidjs/router';
import { actionCreateLeague, actionUpdateLeague } from '#flib/trpcCalls';
import { useToast } from '#providers/ToastProvider';
import style from './LeagueCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface LeagueCreatorModalProps {
  league?: League;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const LeagueCreatorModal: Component<LeagueCreatorModalProps> = (
  props,
) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.league === undefined;

  const config: CreatorState = isCreating
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

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    LeagueCreate,
    {
      updateMode: !isCreating,
    },
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleError = (err: unknown) => {
    actions.error(config.errorMessage);
    console.error(config.logLabel, err);
  };

  const handleSuccess = (league: League) => {
    actions.success(config.successMessage);
    closeModal(league);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreateLeague);
  const updateAction = useAction(actionUpdateLeague);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize League Creator modal');
    closeModal(false);
    return;
  }

  const acton = (data: LeagueCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({ ...data, uuid: props.league!.uuid });
  };

  const handleSubmit = formSubmit(acton, handleSuccess, handleError);

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
        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Name</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="League name"
            minLength={3}
            maxLength={64}
            required
            name="name"
            value={props.league?.name ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.name}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Alias</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Short id"
            minLength={2}
            maxLength={16}
            required
            name="alias"
            value={props.league?.alias ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.alias}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Description</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Optional"
            maxLength={255}
            name="description"
            value={props.league?.description ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.description}
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
