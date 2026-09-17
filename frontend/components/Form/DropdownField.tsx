import { Show } from 'solid-js';
import { Dropdown } from '#components/Dropdown';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const DropdownField: Component<FormFieldProps<'dropdown'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <Show
      when={props.field.multiple}
      fallback={
        <Dropdown
          classList={fieldInputClassList}
          name={props.path}
          options={props.field.options}
          value={(props.value as string | undefined) ?? ''}
          useDirectives={props.directives}
          invalid={!!props.errors[props.path]}
        />
      }
    >
      <Dropdown
        multiple
        classList={fieldInputClassList}
        name={props.path}
        options={props.field.options}
        value={(props.value as string[] | undefined) ?? []}
        useDirectives={props.directives}
        invalid={!!props.errors[props.path]}
      />
    </Show>
  </FieldShell>
);
