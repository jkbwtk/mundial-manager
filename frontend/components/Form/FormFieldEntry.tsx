import { Dynamic } from 'solid-js/web';
import { CheckboxField } from './CheckboxField';
import { ColorField } from './ColorField';
import { DateField } from './DateField';
import { DropdownField } from './DropdownField';
import { MultiResourcePickerField } from './MultiResourcePickerField';
import { NumberField } from './NumberField';
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
    resourcePicker: ResourcePickerField,
    multiResourcePicker: MultiResourcePickerField,
    record: RecordField,
  };

  return fieldComponents[type] as Component<FormFieldProps>;
};

export const FormFieldEntry: Component<FormFieldProps> = (props) => (
  <Dynamic component={getFieldComponent(props.field.type)} {...props} />
);
