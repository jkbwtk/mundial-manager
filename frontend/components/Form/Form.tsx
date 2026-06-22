import {
  createMemo,
  createUniqueId,
  For,
  type JSX,
  Match,
  Switch,
  untrack,
} from 'solid-js';
import type z from 'zod';
import { toJSONSchema } from 'zod';
import { Input } from '#components/Input';
import style from './Form.module.scss';
import 'highlight.js/styles/gml.min.css';
import { TextArea } from '#components/TextArea';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';

export const FormFieldTypes = [
  'text',
  'textArea',
  'number',
  'date',
  'color',
] as const;

export type FormFieldType = (typeof FormFieldTypes)[number];

export interface FormField<Value> {
  label: string;
  type: FormFieldType;
  placeholder?: string;
  unit?: string;
  hidden?: boolean;

  implicitDefault?: Value;

  transform?: (value: Value) => Value;
}

export interface SharedFormProps<
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
  } & {
    uuid?: FormField<string>;
  };
}

export interface FormProps<
  Model extends z.ZodObject,
  Result,
  Action extends (data: z.infer<Model>) => Promise<Result>,
  Instance extends { uuid: string } | undefined,
> extends SharedFormProps<Model, Result, Action, Instance> {
  formId?: string;
  handleSubmit: JSX.EventHandlerUnion<HTMLFormElement, SubmitEvent>;

  fields: {
    [Field in keyof z.infer<Model>]: FormField<z.infer<Model>[Field]>;
  };

  directives: ComponentUseDirectiveHack<HTMLInputElement>[];
  errors: Partial<Record<keyof z.infer<Model>, string[]>>;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const Form = <
  Model extends z.ZodObject,
  Result,
  Action extends (data: z.infer<Model>) => Promise<Result>,
  Instance extends { uuid: string } | undefined,
>(
  props: FormProps<Model, Result, Action, Instance>,
) => {
  const defaultFormId = createUniqueId();

  const visibleFields = () =>
    (Object.entries(props.fields) as [string, FormField<unknown>][]).filter(
      ([, field]) => !field.hidden,
    );

  const schema = createMemo(() => toJSONSchema(props.model));

  return (
    <form
      id={props.formId ?? defaultFormId}
      classList={{
        [style.container]: true,
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
      onSubmit={props.handleSubmit}
    >
      <For each={visibleFields()}>
        {([fieldName, field]) => {
          const required = untrack(() =>
            schema().required?.includes(fieldName),
          );

          return (
            <Switch>
              <Match when={field.type === 'text'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}:
                  </span>
                  <Input
                    classList={{ [style.fieldInput]: true, input: true }}
                    type="text"
                    placeholder={field.placeholder}
                    name={fieldName}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? ''}
                    required={required}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>

              <Match when={field.type === 'number'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}:
                  </span>
                  <Input
                    classList={{ [style.fieldInput]: true, input: true }}
                    type="number"
                    placeholder={field.placeholder}
                    name={fieldName}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? ''}
                    required={required}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  >
                    {field.unit}
                  </Input>
                </div>
              </Match>

              <Match when={field.type === 'color'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}:
                  </span>
                  <Input
                    classList={{ [style.fieldInput]: true, input: true }}
                    type="color"
                    placeholder={field.placeholder}
                    name={fieldName}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? ''}
                    required={required}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>

              <Match when={field.type === 'textArea'}>
                <span classList={{ [style.fieldLabel]: true, label: true }}>
                  {field.label}:
                </span>
                <TextArea
                  classList={{ [style.fieldInput]: true, input: true }}
                  placeholder={field.placeholder}
                  name={fieldName}
                  // @ts-expect-error
                  value={props.instance?.[fieldName] ?? ''}
                  required={required}
                  autocomplete="off"
                  useDirectives={props.directives}
                  invalid={!!props.errors[fieldName]}
                />
              </Match>
            </Switch>
          );
        }}
      </For>
    </form>
  );
};
