import {
  createMemo,
  createUniqueId,
  For,
  type JSX,
  Match,
  Show,
  Switch,
  untrack,
} from 'solid-js';
import type z from 'zod';
import { toJSONSchema } from 'zod';
import { DateInput } from '#components/DateInput';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { Input } from '#components/Input';
import { Required } from '#components/Required';
import { TextArea } from '#components/TextArea';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';
import style from './Form.module.scss';

export const FormFieldTypes = [
  'text',
  'textArea',
  'number',
  'date',
  'color',
  'dropdown',
] as const;

export type FormFieldType = (typeof FormFieldTypes)[number];

interface BaseFormField<Value> {
  label: string;
  type: FormFieldType;
  placeholder?: string;
  hidden?: boolean;

  implicitDefault?: Value;

  transform?: (value: Value) => Value;
}

export type FormField<Value> =
  | (BaseFormField<Value> & {
      type: 'number';
      unit?: string;
    })
  | (BaseFormField<Value> & {
      type: 'dropdown';
      options: DropdownOption[];
    })
  | BaseFormField<Value>;

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

  const schema = createMemo(() =>
    toJSONSchema(props.model, { unrepresentable: 'any' }),
  );

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
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
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
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
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
                    {
                      // @ts-expect-error
                      field.unit ?? ''
                    }
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
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
                  </span>

                  <Input
                    classList={{ [style.fieldInput]: true, input: true }}
                    type="color"
                    placeholder={field.placeholder}
                    name={fieldName}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? '#FFFFFF'}
                    required={required}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>

              <Match when={field.type === 'textArea'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
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
                </div>
              </Match>

              <Match when={field.type === 'date'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
                  </span>

                  <DateInput
                    classList={{ [style.fieldInput]: true, input: true }}
                    name={fieldName}
                    // @ts-expect-error
                    value={props.instance?.[fieldName]}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>

              <Match when={field.type === 'dropdown'}>
                <div
                  classList={{
                    [style.fieldContainer]: true,
                    [`form-field-${fieldName}`]: true,
                  }}
                >
                  <span classList={{ [style.fieldLabel]: true, label: true }}>
                    {field.label}
                    <Show when={required}>
                      <Required />
                    </Show>
                    :
                  </span>
                  <Dropdown
                    classList={{ [style.fieldInput]: true, input: true }}
                    name={fieldName}
                    // @ts-expect-error
                    options={field.options}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? ''}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>
            </Switch>
          );
        }}
      </For>
    </form>
  );
};
