import { MultiResourcePicker } from '#components/ResourcePicker';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const MultiResourcePickerField: Component<
  FormFieldProps<'multiResourcePicker'>
> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <MultiResourcePicker
      classList={fieldInputClassList}
      name={props.path}
      queryById={props.field.queryById}
      query={props.field.query}
      toEntry={props.field.toEntry}
      value={(props.value as string[] | undefined) ?? undefined}
      useDirectives={props.directives}
      invalid={!!props.errors[props.path]}
    />
  </FieldShell>
);
