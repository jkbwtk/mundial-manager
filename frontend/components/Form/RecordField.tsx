import type { ComponentProps } from 'solid-js';
import { RecordEditor } from '#components/RecordEditor';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const RecordField: Component<FormFieldProps<'record'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <RecordEditor
      classList={fieldInputClassList}
      name={props.path}
      value={
        (props.value as ComponentProps<typeof RecordEditor>['value']) ??
        undefined
      }
      keyPlaceholder={props.field.keyPlaceholder}
      valuePlaceholder={props.field.valuePlaceholder}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
