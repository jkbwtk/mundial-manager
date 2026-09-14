import type { ComponentProps } from 'solid-js';
import { Input } from '#components/Input';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const ColorField: Component<FormFieldProps<'color'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <Input
      classList={fieldInputClassList}
      type="color"
      placeholder={props.field.placeholder}
      name={props.path}
      value={
        (props.value as ComponentProps<typeof Input>['value']) ?? '#FFFFFF'
      }
      required={props.required}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
