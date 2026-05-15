import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import type z from 'zod';
import { treeifyError } from 'zod';

export type UseFormValidationOptions = {
  debounceTime?: number;
};

export const useFormValidation = <T extends z.ZodObject>(
  schema: T,
  options: UseFormValidationOptions,
) => {
  const fields: Partial<
    Record<
      keyof z.infer<T>,
      { ref: HTMLInputElement; schemaField: z.ZodTypeAny }
    >
  > = {};

  const [errors, setErrors] = createStore<
    Partial<Record<keyof z.infer<T>, string[]>>
  >({});

  const [canSubmit, setCanSubmit] = createSignal(false);

  const runValidation = async (fieldName: keyof z.infer<T>) => {
    const field = fields[fieldName];

    if (!field) {
      console.warn(`No field found for name ${String(fieldName)}`);
      return;
    }

    const result = await field.schemaField.safeParseAsync(field.ref.value);

    if (result.success) {
      // @ts-expect-error
      setErrors(fieldName, undefined);
      field.ref.setCustomValidity('');
      field.ref.checkValidity();
    } else {
      // @ts-expect-error
      setErrors(fieldName, treeifyError(result.error).errors);
      field.ref.setCustomValidity(errors[fieldName]?.join(', ') ?? '');
      field.ref.checkValidity();
    }

    setCanSubmit(field.ref.form?.checkValidity() ?? false);
  };

  const validate = (ref: HTMLInputElement) => {
    const name = ref.name;

    if (name === '' || name === undefined) {
      console.warn(
        'Input element has no name attribute, skipping validation',
        ref,
      );

      return;
    }

    const schemaField = schema.shape[name];

    if (schemaField === undefined) {
      console.warn(
        `Provided schema does not contain a field with the name ${name}`,
      );
      return;
    }

    // @ts-expect-error
    fields[name] = { ref, schemaField };

    let timeoutRef: ReturnType<typeof setTimeout> | undefined;

    ref.onblur = () => {
      clearTimeout(timeoutRef);
      runValidation(name);
    };

    ref.oninput = () => {
      clearTimeout(timeoutRef);
      setCanSubmit(false);

      timeoutRef = setTimeout(() => {
        runValidation(name);
      }, options.debounceTime ?? 500);
    };
  };

  return {
    validate,
    errors,
    canSubmit,
  };
};
