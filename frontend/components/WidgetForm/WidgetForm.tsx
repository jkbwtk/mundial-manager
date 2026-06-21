import { createUniqueId, type JSX } from 'solid-js';
import type z from 'zod';
import { Button } from '#components/Button';
import { Form, type FormField } from '#components/Form';
import { Widget } from '#components/Widget/Widget';
import { useFormValidation } from '#flib/formValidation';
import style from './WidgetForm.module.scss';

export interface WidgetFormProps<
  Model extends z.ZodObject,
  Result,
  Action extends (data: z.infer<Model>) => Promise<Result>,
  Instance extends { uuid: string } | undefined,
> {
  model: Model;
  action: Action;

  instance?: Instance;

  fields: {
    [Field in keyof z.infer<Model>]: FormField<z.infer<Model>[Field]>;
  };

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];

  formClass?: string;
  formClassList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const WidgetForm = <
  Model extends z.ZodObject,
  Result,
  Action extends (data: z.infer<Model>) => Promise<Result>,
  Instance extends { uuid: string } | undefined,
>(
  props: WidgetFormProps<Model, Result, Action, Instance>,
) => {
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

  const handleSubmit = formSubmit(
    props.action,
    () => {},
    () => {},
  );

  return (
    <Widget
      classList={{
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
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
        model={props.model}
        action={props.action}
        instance={props.instance}
        fields={props.fields}
        directives={[validate]}
        errors={errors}
        class={style.formClass}
        classList={props.formClassList}
      />
    </Widget>
  );
};
