import { type Action, type CustomResponse, useAction } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createUniqueId, type JSX, Show } from 'solid-js';
import type z from 'zod';
import { Button } from '#components/Button';
import { Form, type FormField } from '#components/Form';
import { HighlightedCode } from '#components/HighlightedCode';
import { Divider } from '#components/Widget';
import { Widget } from '#components/Widget/Widget';
import { useFormValidation } from '#flib/formValidation';
import { toJson } from '#flib/utils';
import { useToast } from '#providers/ToastProvider';
import style from './WidgetForm.module.scss';

hljs.registerLanguage('json', json);

export interface WidgetFormProps<
  Model extends z.ZodObject,
  Result,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
> {
  model: Model;
  action: TRPCAction;

  instance?: Instance;

  fields: {
    [Field in keyof z.infer<Model>]: FormField<z.infer<Model>[Field]>;
  };

  onSuccess?: (result: Result) => void;
  onError?: (error: unknown) => void;

  title?: string;
  submitButtonText?: string;
  successMessage?: string;
  errorMessage?: string;
  logLabel?: string;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];

  formClass?: string;
  formClassList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const WidgetForm = <
  Model extends z.ZodObject,
  Result,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
>(
  props: WidgetFormProps<Model, Result, TRPCAction, Instance>,
) => {
  const [, actions] = useToast();

  const formId = createUniqueId();

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    props.model,
    {
      fieldTransforms: Object.fromEntries(
        Object.entries(props.fields)
          .map(([fieldName, field]) => [fieldName, field.transform])
          .filter(([, transform]) => transform !== undefined),
      ),

      updateMode: props.instance !== undefined,

      implicitDefaults: Object.fromEntries(
        Object.entries(props.fields)
          .map(([fieldName, field]) => [fieldName, field.implicitDefault])
          .filter(([, implicitDefault]) => implicitDefault !== undefined),
      ),
    },
  );

  const handleSuccess = () => {
    actions.success(props.successMessage ?? 'Submitted successfully!');
  };

  const handleError = (err: unknown) => {
    actions.error(props.errorMessage ?? 'Submission failed. Please try again.');
    console.error(props.logLabel ?? 'Form submission error:', err);
  };

  const baseAction = useAction(props.action);

  if (baseAction === undefined) {
    throw new Error('Failed to initialize form action');
  }

  const action = (data: z.infer<Model>) => {
    if (props.instance === undefined) {
      // @ts-expect-error
      return baseAction(data);
    }

    // @ts-expect-error
    return baseAction({ ...data, uuid: props.instance.uuid });
  };

  const handleSubmit = formSubmit(
    action,
    props.onSuccess ?? handleSuccess,
    props.onError ?? handleError,
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  return (
    <Widget
      topLeftLabels={props.title}
      classList={{
        [style.container]: true,
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
      bottomLeftLabels={
        <Button type="reset" severity="secondary" form={formId}>
          Reset
        </Button>
      }
      bottomRightLabels={[
        <Button
          type="submit"
          form={formId}
          loading={handleSubmit.isSubmitting()}
          disabled={!canSubmit()}
        >
          Submit
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

      <div class={style.hintRow}>
        <Show
          when={hasValidationErrors()}
          fallback={<span class={style.noErrors}>No validation errors</span>}
        >
          <HighlightedCode language="json" code={`Errors: ${toJson(errors)}`} />
        </Show>
      </div>
    </Widget>
  );
};
