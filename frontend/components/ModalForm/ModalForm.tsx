import { type Action, type CustomResponse, useAction } from '@solidjs/router';
import { createUniqueId, type JSX } from 'solid-js';
import type z from 'zod';
import { Button } from '#components/Button';
import { Form, type SharedFormProps } from '#components/Form';
import { FormErrors } from '#components/FormErrors';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import style from './ModalForm.module.scss';

export interface ModalFormLabels {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export interface ModalFormProps<
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
> extends SharedFormProps<Model, Result, TRPCAction, Instance>,
    ModalFormLabels {
  onSuccess?: (result: Result) => void;
  onError?: (error: unknown) => void;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];

  formClass?: string;
  formClassList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const ModalForm = <
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
>(
  props: ModalFormProps<Model, Result, TRPCAction, Instance>,
) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const fieldNames = () =>
    Object.fromEntries(
      Object.entries(props.fields).map(([key, field]) => [key, field.label]),
    );

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    props.model,
    {
      updateMode: props.instance !== undefined,

      implicitDefaults: Object.fromEntries(
        Object.entries(props.fields)
          .map(([fieldName, field]) => [fieldName, field.implicitDefault])
          .filter(([, implicitDefault]) => implicitDefault !== undefined),
      ),
    },
  );

  const handleSuccess = (data: Result) => {
    actions.success(props.successMessage);
    closeModal(data);
  };

  const handleError = (err: unknown) => {
    actions.error(props.errorMessage);
    console.error(props.logLabel, err);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const action = useAction(props.action);

  if (action === undefined) {
    throw new Error('Failed to initialize form action');
  }

  const handleSubmit = formSubmit(
    // @ts-expect-error
    action,
    props.onSuccess ?? handleSuccess,
    props.onError ?? handleError,
  );

  return (
    <Modal
      classList={{
        [props.class!]: true,

        ...(props.classList ?? {}),
      }}
      topLeftLabels={props.title}
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
          {props.submitButtonText}
        </Button>,
      ]}
    >
      <Form
        formId={formId}
        handleSubmit={handleSubmit}
        model={props.model}
        action={props.action}
        instance={props.instance}
        fields={props.fields}
        directives={[validate]}
        errors={errors}
        class={props.formClass}
        classList={props.formClassList}
      />

      <Divider class={style.divider} />

      <FormErrors errors={errors} fieldNames={fieldNames()} />
    </Modal>
  );
};
