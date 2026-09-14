import { ResourcePicker } from '#components/ResourcePicker';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const ResourcePickerField: Component<
  FormFieldProps<'resourcePicker'>
> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <ResourcePicker
      classList={fieldInputClassList}
      name={props.path}
      placeholder={props.field.placeholder}
      queryById={props.field.queryById}
      query={props.field.query}
      toEntry={props.field.toEntry}
      value={(props.value as string | undefined) ?? undefined}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
