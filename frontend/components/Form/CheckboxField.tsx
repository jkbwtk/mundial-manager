import type { ComponentProps } from 'solid-js';
import { Input } from '#components/Input';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const CheckboxField: Component<FormFieldProps<'checkbox'>> = (props) => (
  <FieldShell
    inline
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <Input
      classList={fieldInputClassList}
      type="checkbox"
      name={props.path}
      checked={
        (props.value as ComponentProps<typeof Input>['checked']) ?? false
      }
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
