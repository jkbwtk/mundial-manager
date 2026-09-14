import type { Action, CustomResponse } from '@solidjs/router';
import { createMemo, createUniqueId, For, untrack } from 'solid-js';
import type z from 'zod';
import { toJSONSchema } from 'zod';
import style from './Form.module.scss';
import { FormFieldEntry } from './FormFieldEntry';
import { getVisibleFields } from './fieldUtils';
import type { FormProps } from './types';

export const Form = <
  Model extends z.ZodObject,
  Result extends ReturnType<TRPCAction>,
  TRPCAction extends Action<[data: z.infer<Model>], CustomResponse<Result>>,
  Instance extends { uuid: string } | undefined,
>(
  props: FormProps<Model, Result, TRPCAction, Instance>,
) => {
  const defaultFormId = createUniqueId();

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
      <For each={getVisibleFields(props.fields)}>
        {([fieldName, field]) => {
          const rootSchema = untrack(schema);

          return (
            <FormFieldEntry
              path={fieldName}
              field={field}
              value={
                (props.instance as Record<string, unknown> | undefined)?.[
                  fieldName
                ]
              }
              required={rootSchema.required?.includes(fieldName) ?? false}
              directives={props.directives}
              errors={props.errors}
            />
          );
        }}
      </For>
    </form>
  );
};
