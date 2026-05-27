import { useAction } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import {
  createMemo,
  createUniqueId,
  For,
  type getOwner,
  runWithOwner,
  Show,
} from 'solid-js';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { actionCreateMatch, actionUpdateMatch } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import 'highlight.js/styles/gml.min.css';
import { DateInput } from '#components/DateInput';
import {
  type Match,
  MatchCreate,
  MatchStatusEnum,
} from '#shared/types/api/match';
import style from './MatchCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface MatchCreatorModalProps {
  match?: Match;
  owner: ReturnType<typeof getOwner>;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const MatchCreatorModal: Component<MatchCreatorModalProps> = (props) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.match === undefined;

  const config: CreatorState = isCreating
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

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    MatchCreate,
    {
      updateMode: !isCreating,
      implicitDefaults: {
        events: [],
      },
    },
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleError = (err: unknown) => {
    actions.error(config.errorMessage);
    console.error(config.logLabel, err);
  };

  const handleSuccess = (match: Match) => {
    actions.success(config.successMessage);
    closeModal(match);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = runWithOwner(props.owner, () =>
    useAction(actionCreateMatch),
  );
  const updateAction = runWithOwner(props.owner, () =>
    useAction(actionUpdateMatch),
  );

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Match Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: MatchCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.match!.uuid,
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
          <span class={style.fieldLabel}>Start Date:</span>
          <DateInput
            class={style.fieldInput}
            name="startDate"
            value={props.match ? new Date(props.match.startDate) : new Date()}
            useDirectives={[validate]}
            invalid={!!errors.startDate}
          />

          <span class={style.fieldLabel}>Duration (seconds):</span>
          <Input
            class={style.fieldInput}
            type="number"
            placeholder="Match duration in seconds"
            min={0}
            required
            name="duration"
            value={props.match?.duration.toString() ?? '0'}
            useDirectives={[validate]}
            invalid={!!errors.duration}
          />

          <span class={style.fieldLabel}>Pause Duration (seconds):</span>
          <Input
            class={style.fieldInput}
            type="number"
            placeholder="Match pause duration in seconds"
            min={0}
            name="pauseDuration"
            value={props.match?.pauseDuration?.toString() ?? '0'}
            useDirectives={[validate]}
            invalid={!!errors.pauseDuration}
          />

          <span class={style.fieldLabel}>Status:</span>
          <For each={Object.values(MatchStatusEnum)}>
            {(status) => (
              <div>
                <Input
                  id={status}
                  type="radio"
                  name="status"
                  value={status}
                  required
                  checked={props.match?.status === status}
                  useDirectives={[validate]}
                  invalid={!!errors.status}
                >
                  {status}
                </Input>
              </div>
            )}
          </For>
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
