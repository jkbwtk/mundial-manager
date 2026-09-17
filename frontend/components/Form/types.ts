import type { Action, CustomResponse } from '@solidjs/router';
import type { JSX } from 'solid-js';
import type z from 'zod';
import type { DateMode } from '#components/DateInput';
import type { DropdownOption } from '#components/Dropdown';
import type { PickerEntry, PickerQueryMeta } from '#components/ResourcePicker';
import type { ComponentUseDirectiveHack } from '#flib/solidHelpers';
import type { PaginatedResponse } from '#shared/zod';

export const FormFieldTypes = [
  'text',
  'textArea',
  'number',
  'checkbox',
  'date',
  'color',
  'dropdown',
  'resourcePicker',
  'multiResourcePicker',
  'object',
  'record',
] as const;

export type FormFieldType = (typeof FormFieldTypes)[number];

export interface BaseFormField<Value> {
  label: string;
  type: FormFieldType;
  placeholder?: string;
  hidden?: boolean;

  implicitDefault?: Value;

  transform?: (value: Value) => Value;
  format?: (value: Value) => Value;
}

export type FormField<Value> =
  | (BaseFormField<Value> & {
      type: 'number';
      unit?: string;

      step?: number | 'any';
      min?: number;
      max?: number;
    })
  | (BaseFormField<Value> & {
      type: 'checkbox';
    })
  | (BaseFormField<Value> & {
      type: 'date';
      dateMode: DateMode;
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
  | (BaseFormField<Value> & {
      type: 'object';
      fields: Value extends Record<string, unknown>
        ? { [Field in keyof Value]: FormField<Value[Field]> }
        : never;
    })
  | (BaseFormField<Value> & {
      type: 'record';
      keyPlaceholder?: string;
      valuePlaceholder?: string;
    })
  | BaseFormField<Value>;

type SpecificFormField<Type extends FormFieldType> =
  FormField<unknown> extends infer Field
    ? Field extends { type: infer FieldType }
      ? FormFieldType extends FieldType
        ? never
        : [Type] extends [FieldType]
          ? Field
          : never
      : never
    : never;

export type FormFieldOfType<Type extends FormFieldType> = [
  SpecificFormField<Type>,
] extends [never]
  ? BaseFormField<unknown>
  : SpecificFormField<Type>;

export type FormFieldMap = Record<string, FormField<unknown>>;

export interface FieldMeta {
  names: Record<string, string>;
  implicitDefaults: Record<string, unknown>;
  transforms: Record<string, (value: unknown) => unknown>;
}

export interface JSONSchemaNode {
  properties?: Record<string, JSONSchemaNode | undefined>;
  required?: string[];
}

export interface FormFieldProps<Type extends FormFieldType = FormFieldType> {
  path: string;
  field: FormFieldOfType<Type>;
  value: unknown;
  required: boolean;

  schemaNode: JSONSchemaNode | undefined;

  directives: ComponentUseDirectiveHack<HTMLInputElement>[];
  errors: Partial<Record<string, string[]>>;
}

export interface SharedFormProps<
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
> {
  model: Model;
  action: TRPCAction;

  instance?: Instance;

  initialValues?: Partial<z.infer<Model>>;

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
  errors: Partial<Record<string, string[]>>;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}
