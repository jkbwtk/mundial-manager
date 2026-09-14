import type { ComponentProps } from 'solid-js';
import { TextArea } from '#components/TextArea';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const TextAreaField: Component<FormFieldProps<'textArea'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <TextArea
      classList={fieldInputClassList}
      placeholder={props.field.placeholder}
      name={props.path}
      value={(props.value as ComponentProps<typeof TextArea>['value']) ?? ''}
      required={props.required}
      autocomplete="off"
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
