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
import { actionCreateTable, actionUpdateTable } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import 'highlight.js/styles/gml.min.css';
import { autofocus } from '#flib/solidHelpers';
import { type Table, TableCreate } from '#shared/types/api/table';
import style from './TableCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface TableCreatorModalProps {
  table?: Table;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const TableCreatorModal: Component<TableCreatorModalProps> = (props) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.table === undefined;

  const config: CreatorState = isCreating
    ? {
        title: 'Table Creator',
        submitButtonText: 'Create',
        successMessage: 'Table created successfully!',
        errorMessage: 'Failed to create table. Please try again.',
        logLabel: 'Table creation error:',
      }
    : {
        title: 'Table Editor',
        submitButtonText: 'Update',
        successMessage: 'Table updated successfully!',
        errorMessage: 'Failed to update table. Please try again.',
        logLabel: 'Table update error:',
      };

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    TableCreate,
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

  const handleSuccess = (table: Table) => {
    actions.success(config.successMessage);
    closeModal(table);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreateTable);
  const updateAction = useAction(actionUpdateTable);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Table Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: TableCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.table!.uuid,
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
            placeholder="Table name"
            maxLength={255}
            required
            name="name"
            value={props.table?.name ?? ''}
            useDirectives={[validate, autofocus]}
            invalid={!!errors.name}
          />

          <span class={style.fieldLabel}>Alias:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Table alias"
            maxLength={255}
            required
            name="alias"
            value={props.table?.alias ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.alias}
          />

          <span class={style.fieldLabel}>Side #1 Color:</span>
          <Input
            class={style.fieldInput}
            type="color"
            placeholder="Side #1 Color"
            maxLength={255}
            required
            name="side1Color"
            value={props.table?.side1Color ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.side1Color}
          />

          <span class={style.fieldLabel}>Side #2 Color:</span>
          <Input
            class={style.fieldInput}
            type="color"
            placeholder="Side #2 Color"
            maxLength={255}
            required
            name="side2Color"
            value={props.table?.side2Color ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.side2Color}
          />

          <span class={style.fieldLabel}>Location:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Table location"
            maxLength={255}
            required
            name="location"
            value={props.table?.location ?? ''}
            useDirectives={[validate]}
            invalid={!!errors.location}
          />

          <span class={style.fieldLabel}>Description:</span>
          <Input
            class={style.fieldInput}
            type="text"
            placeholder="Optional"
            maxLength={255}
            name="description"
            value={props.table?.description ?? ''}
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
