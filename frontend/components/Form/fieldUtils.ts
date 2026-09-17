import type {
  FieldMeta,
  FormField,
  FormFieldMap,
  FormFieldOfType,
} from './types';

export const getVisibleFields = (fields: object) =>
  (Object.entries(fields) as [string, FormField<unknown>][]).filter(
    ([, field]) => !field.hidden,
  );

export const formatFieldValue = (
  field: FormField<unknown>,
  value: unknown,
): unknown =>
  field.format === undefined || value === undefined || value === null
    ? value
    : field.format(value);

export const collectFieldMeta = (
  fields: FormFieldMap,
  pathPrefix = '',
  labelPrefix = '',
): FieldMeta => {
  const names: Record<string, string> = {};
  const implicitDefaults: Record<string, unknown> = {};
  const transforms: Record<string, (value: unknown) => unknown> = {};

  for (const [key, field] of Object.entries(fields)) {
    const path = pathPrefix ? `${pathPrefix}.${key}` : key;
    const label = labelPrefix ? `${labelPrefix} → ${field.label}` : field.label;

    names[path] = label;

    if (field.implicitDefault !== undefined) {
      implicitDefaults[path] = field.implicitDefault;
    }

    if (field.transform !== undefined) {
      transforms[path] = field.transform;
    }

    if (field.type === 'object') {
      const nested = collectFieldMeta(
        (field as FormFieldOfType<'object'>).fields as FormFieldMap,
        path,
        label,
      );

      Object.assign(names, nested.names);
      Object.assign(implicitDefaults, nested.implicitDefaults);
      Object.assign(transforms, nested.transforms);
    }
  }

  return { names, implicitDefaults, transforms };
};
