import type { Action, CustomResponse } from '@solidjs/router';
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
import {
  MultiResourcePicker,
  type PickerEntry,
  type PickerQueryMeta,
  ResourcePicker,
} from '#components/ResourcePicker';
import { TextArea } from '#components/TextArea';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';
import type { PaginatedResponse } from '#shared/zod';
import style from './Form.module.scss';

export const FormFieldTypes = [
  'text',
  'textArea',
  'number',
  'date',
  'color',
  'dropdown',
  'resourcePicker',
  'multiResourcePicker',
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
  | (BaseFormField<Value> & {
      type: 'resourcePicker' | 'multiResourcePicker';
      // biome-ignore lint/suspicious/noExplicitAny: yeah
      query: (meta?: PickerQueryMeta) => Promise<PaginatedResponse<any>>;
      // biome-ignore lint/suspicious/noExplicitAny: yeah
      toEntry: (data: any) => PickerEntry<string>;

      // biome-ignore lint/suspicious/noExplicitAny: yeah
      queryById: (id: string) => Promise<any>;
    })
  | BaseFormField<Value>;

export interface SharedFormProps<
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
> {
  model: Model;
  action: TRPCAction;

  instance?: Instance;

  fields: {
    [Field in keyof z.infer<Model>]: FormField<z.infer<Model>[Field]>;
  } & {
    uuid?: FormField<string>;
  };
}

export interface FormProps<
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
> extends SharedFormProps<Model, Result, TRPCAction, Instance> {
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
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
>(
  props: FormProps<Model, Result, TRPCAction, Instance>,
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

              <Match when={field.type === 'resourcePicker'}>
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

                  <ResourcePicker
                    classList={{ [style.fieldInput]: true, input: true }}
                    name={fieldName}
                    placeholder={field.placeholder}
                    // @ts-expect-error
                    queryById={field.queryById}
                    // @ts-expect-error
                    query={field.query}
                    // @ts-expect-error
                    toEntry={field.toEntry}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? undefined}
                    useDirectives={props.directives}
                    invalid={!!props.errors[fieldName]}
                  />
                </div>
              </Match>

              <Match when={field.type === 'multiResourcePicker'}>
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

                  <MultiResourcePicker
                    classList={{ [style.fieldInput]: true, input: true }}
                    name={fieldName}
                    // @ts-expect-error
                    queryById={field.queryById}
                    // @ts-expect-error
                    query={field.query}
                    // @ts-expect-error
                    toEntry={field.toEntry}
                    // @ts-expect-error
                    value={props.instance?.[fieldName] ?? undefined}
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
