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

  const preprocessValue = (value: unknown) => {
    switch (typeof value) {
      case 'string':
        if (value.trim() === '') return undefined;
        return value;

      default:
        return value;
    }
  };

  const convertFormDataToObject = (
    formData: FormData,
  ): Record<string, unknown> => {
    const entries = formData
      .entries()
      .filter(([, value]) => preprocessValue(value) !== undefined);

    return Object.fromEntries(entries);
  };

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

    const value = preprocessValue(field.ref.value);
    const result = await field.schemaField.safeParseAsync(value);

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

    const form = field.ref.form!;
    setCanSubmit(form.checkValidity() ?? false);
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

    fields[name as keyof z.infer<T>] = { ref, schemaField };

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
      }, options.debounceTime ?? 3000);
    };
  };

  const formSubmit = <R>(handler: (data: z.infer<T>) => Promise<R>) => {
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const submitter = async (ev: SubmitEvent) => {
      ev.preventDefault();

      const form = ev.currentTarget;

      if (!(form instanceof HTMLFormElement)) {
        console.warn('Event target is not a form element', form);
        return;
      }

      const formData = new FormData(form);
      const dataObject = convertFormDataToObject(formData);

      const result = await schema.safeParseAsync(dataObject);

      if (!result.success) {
        const fieldErrors = treeifyError(result.error).properties ?? {};

        for (const [key, errors] of Object.entries(fieldErrors)) {
          const field = fields[key as keyof z.infer<T>];

          if (!field || !errors) {
            console.warn(`No field found for name ${key}`);
            continue;
          }

          // @ts-expect-error
          setErrors(key, errors.errors);
          field.ref.setCustomValidity(errors.errors.join(', '));
          field.ref.checkValidity();
        }

        setCanSubmit(false);
        return;
      }

      setIsSubmitting(true);

      try {
        await handler(result.data);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitter.isSubmitting = isSubmitting;

    return submitter;
  };

  return {
    validate,
    errors,
    canSubmit,
    formSubmit,
  };
};
