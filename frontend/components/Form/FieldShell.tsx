import { Show } from 'solid-js';
import { Required } from '#components/Required';
import style from './Form.module.scss';

export const fieldInputClassList = { [style.fieldInput]: true, input: true };

export interface FieldShellProps {
  path: string;
  label: string;
  required: boolean;
}

export const FieldShell: ParentComponent<FieldShellProps> = (props) => (
  <div
    classList={{
      [style.fieldContainer]: true,
      [`form-field-${props.path}`]: true,
    }}
  >
    <span classList={{ [style.fieldLabel]: true, label: true }}>
      {props.label}
      <Show when={props.required}>
        <Required />
      </Show>
      :
    </span>

    {props.children}
  </div>
);
