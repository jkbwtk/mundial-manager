import type { FormField } from './types';

export const getVisibleFields = (fields: object) =>
  (Object.entries(fields) as [string, FormField<unknown>][]).filter(
    ([, field]) => !field.hidden,
  );
