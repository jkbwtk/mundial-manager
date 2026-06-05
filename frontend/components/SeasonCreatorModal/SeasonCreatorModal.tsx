import { useAction } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createUniqueId, Show } from 'solid-js';
import { Button } from '#components/Button';
import { DateInput } from '#components/DateInput';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { actionCreateSeason, actionUpdateSeason } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { type Season, SeasonCreate } from '#shared/types/api/season';
import 'highlight.js/styles/gml.min.css';
import dayjs from 'dayjs';
import style from './SeasonCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface SeasonCreatorModalProps {
  season?: Season;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const SeasonCreatorModal: Component<SeasonCreatorModalProps> = (
  props,
) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.season === undefined;

  const config: CreatorState = isCreating
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

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    SeasonCreate,
    {
      updateMode: !isCreating,
      implicitDefaults: {
        config: {},
        labels: [],
      },
      fieldTransforms: {
        startDate: (v) => dayjs(v).startOf('day').toDate(),
        endDate: (v) => dayjs(v).endOf('day').toDate(),
      },
    },
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleError = (err: unknown) => {
    actions.error(config.errorMessage);
    console.error(config.logLabel, err);
  };

  const handleSuccess = (season: Season) => {
    actions.success(config.successMessage);
    closeModal(season);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreateSeason);
  const updateAction = useAction(actionUpdateSeason);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Season Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: SeasonCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.season!.uuid,
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
        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Name:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Season name"
            maxLength={255}
            required
            name="name"
            value={props.season?.name ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.name}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Start Date:</span>
          <DateInput
            class={style.dateInput}
            name="startDate"
            value={props.season?.startDate ?? null}
            useDirectives={[validate]}
            invalid={!!errors.startDate}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>End Date:</span>
          <DateInput
            class={style.dateInput}
            name="endDate"
            value={props.season?.endDate ?? null}
            useDirectives={[validate]}
            invalid={!!errors.endDate}
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
