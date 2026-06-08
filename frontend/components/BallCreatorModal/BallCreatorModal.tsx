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
import { actionCreateBall, actionUpdateBall } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import 'highlight.js/styles/gml.min.css';
import { autofocus } from '#flib/solidHelpers';
import { type Ball, BallCreate } from '#shared/types/api/ball';
import style from './BallCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface BallCreatorModalProps {
  ball?: Ball;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const BallCreatorModal: Component<BallCreatorModalProps> = (props) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.ball === undefined;

  const config: CreatorState = isCreating
    ? {
        title: 'Ball Creator',
        submitButtonText: 'Create',
        successMessage: 'Ball created successfully!',
        errorMessage: 'Failed to create ball. Please try again.',
        logLabel: 'Ball creation error:',
      }
    : {
        title: 'Ball Editor',
        submitButtonText: 'Update',
        successMessage: 'Ball updated successfully!',
        errorMessage: 'Failed to update ball. Please try again.',
        logLabel: 'Ball update error:',
      };

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    BallCreate,
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

  const handleSuccess = (ball: Ball) => {
    actions.success(config.successMessage);
    closeModal(ball);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreateBall);
  const updateAction = useAction(actionUpdateBall);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Ball Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: BallCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.ball!.uuid,
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
            placeholder="Ball name"
            maxLength={255}
            required
            name="name"
            value={props.ball?.name ?? ''}
            useDirectives={[validate, autofocus]}
            invalid={!!errors.name}
          />

          <span class={style.fieldLabel}>Alias:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Ball alias"
            maxLength={255}
            required
            name="alias"
            value={props.ball?.alias ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.alias}
          />

          <span class={style.fieldLabel}>Color:</span>
          <Input
            class={style.fieldInput}
            type="color"
            placeholder="Ball color"
            maxLength={255}
            required
            name="color"
            value={props.ball?.color ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.color}
          />

          <span class={style.fieldLabel}>Diameter:</span>
          <Input
            class={style.fieldInput}
            type="number"
            placeholder="Ball diameter"
            maxLength={255}
            required
            name="diameter"
            value={props.ball?.diameter ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.diameter}
          >
            mm
          </Input>

          <span class={style.fieldLabel}>Weight:</span>
          <Input
            class={style.fieldInput}
            type="number"
            placeholder="Ball weight"
            maxLength={255}
            required
            name="weight"
            value={props.ball?.weight ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.weight}
          >
            g
          </Input>

          <span class={style.fieldLabel}>Description:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Optional"
            maxLength={255}
            name="description"
            value={props.ball?.description ?? ''}
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
