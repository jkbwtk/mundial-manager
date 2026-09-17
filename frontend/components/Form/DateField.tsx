import type { ComponentProps } from 'solid-js';
import { Show } from 'solid-js';
import { DateInput, DateStepper } from '#components/DateInput';
import { FieldShell, fieldInputClassList } from './FieldShell';
import type { FormFieldProps } from './types';

export const DateField: Component<FormFieldProps<'date'>> = (props) => (
  <FieldShell
    path={props.path}
    label={props.field.label}
    required={props.required}
  >
    <Show
      when={props.field.steps}
      fallback={
        <DateInput
          classList={fieldInputClassList}
          name={props.path}
          value={props.value as ComponentProps<typeof DateInput>['value']}
          dateMode={props.field.dateMode}
          required={props.required}
          useDirectives={props.directives}
          invalid={!!props.errors[props.path]}
        />
      }
    >
      {(steps) => (
        <DateStepper
          classList={fieldInputClassList}
          name={props.path}
          steps={steps()}
          value={props.value as ComponentProps<typeof DateInput>['value']}
          dateMode={props.field.dateMode}
          required={props.required}
          useDirectives={props.directives}
          invalid={!!props.errors[props.path]}
        />
      )}
    </Show>
  </FieldShell>
);
