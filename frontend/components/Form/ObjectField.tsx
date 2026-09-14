import { For, Show } from 'solid-js';
import { Required } from '#components/Required';
import { Widget } from '#components/Widget';
import style from './Form.module.scss';
import { FormFieldEntry } from './FormFieldEntry';
import { getVisibleFields } from './fieldUtils';
import type { FormFieldProps } from './types';

export const ObjectField: Component<FormFieldProps<'object'>> = (props) => (
  <Widget
    classList={{
      [style.fieldGroup]: true,
      [`form-field-${props.path}`]: true,
    }}
    topLeftLabels={
      <span classList={{ [style.fieldGroupLabel]: true, label: true }}>
        {props.field.label}
        <Show when={props.required}>
          <Required />
        </Show>
      </span>
    }
  >
    <div class={style.fieldGroupContent}>
      <For each={getVisibleFields(props.field.fields)}>
        {([subFieldName, subField]) => (
          <FormFieldEntry
            path={`${props.path}.${subFieldName}`}
            field={subField}
            value={
              (props.value as Record<string, unknown> | undefined)?.[
                subFieldName
              ]
            }
            required={
              props.schemaNode?.required?.includes(subFieldName) ?? false
            }
            schemaNode={props.schemaNode?.properties?.[subFieldName]}
            directives={props.directives}
            errors={props.errors}
          />
        )}
      </For>
    </div>
  </Widget>
);
