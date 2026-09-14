import type { ComponentProps } from 'solid-js';
import { DateInput } from '#components/DateInput';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const DateField: Component<FormFieldProps<'date'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <DateInput
      classList={fieldInputClassList}
      name={props.path}
      value={props.value as ComponentProps<typeof DateInput>['value']}
      dateMode={props.field.dateMode}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
