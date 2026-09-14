import type { ComponentProps } from 'solid-js';
import { Input } from '#components/Input';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const NumberField: Component<FormFieldProps<'number'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <Input
      classList={fieldInputClassList}
      type="number"
      placeholder={props.field.placeholder}
      name={props.path}
      value={(props.value as ComponentProps<typeof Input>['value']) ?? ''}
      required={props.required}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    >
      {props.field.unit ?? ''}
    </Input>
  </FieldShell>
);
