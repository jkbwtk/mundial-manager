import { ButtonGroup } from '#components/ButtonGroup';
import { FieldShell } from './FieldShell';
import type { FormFieldProps } from './types';

export const ButtonGroupField: Component<FormFieldProps<'buttonGroup'>> = (
  props,
) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <ButtonGroup
      name={props.path}
      ariaLabel={props.field.label}
      options={props.field.options}
      value={props.value as string | undefined}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
