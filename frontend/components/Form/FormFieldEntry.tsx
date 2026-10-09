import { Dynamic } from 'solid-js/web';
import { ButtonGroupField } from './ButtonGroupField';
import { CheckboxField } from './CheckboxField';
import { ColorField } from './ColorField';
import { DateField } from './DateField';
import { DropdownField } from './DropdownField';
import { formatFieldValue } from './fieldUtils';
import { MultiResourcePickerField } from './MultiResourcePickerField';
import { NumberField } from './NumberField';
import { ObjectField } from './ObjectField';
import { RecordField } from './RecordField';
import { ResourcePickerField } from './ResourcePickerField';
import { TextAreaField } from './TextAreaField';
import { TextField } from './TextField';
import type { FormFieldProps, FormFieldType } from './types';

const getFieldComponent = (type: FormFieldType) => {
  const fieldComponents: {
    [Type in FormFieldType]: Component<FormFieldProps<Type>>;
  } = {
    text: TextField,
    textArea: TextAreaField,
    number: NumberField,
    checkbox: CheckboxField,
    date: DateField,
    color: ColorField,
    dropdown: DropdownField,
    buttonGroup: ButtonGroupField,
    resourcePicker: ResourcePickerField,
    multiResourcePicker: MultiResourcePickerField,
    object: ObjectField,
    record: RecordField,
  };

  return fieldComponents[type] as Component<FormFieldProps>;
};

const getInitialValue = (props: FormFieldProps) => {
  if (props.value !== undefined || props.field.type === 'object') {
    return props.value;
  }

  return props.schemaNode?.default ?? undefined;
};

export const FormFieldEntry: Component<FormFieldProps> = (props) => (
  <Dynamic
    component={getFieldComponent(props.field.type)}
    {...props}
    value={formatFieldValue(props.field, getInitialValue(props))}
  />
);
