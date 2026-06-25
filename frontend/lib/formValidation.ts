import { TRPCClientError } from '@trpc/client';
import { batch, createSignal, type JSX } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import type z from 'zod';
import { treeifyError } from 'zod';
import { normalizeInputType } from '#flib/utils';
import { ZodLikeError } from '#shared/zod';

export interface FormValidationCompatible {
  name: string;
  type?: string;
  inputMode?: JSX.InputHTMLAttributes<HTMLInputElement>['inputMode'];

  invalid?: boolean;
  disabled?: boolean;

  // biome-ignore lint/suspicious/noExplicitAny: yeah
  value: any;

  /**
   * Used only when type is `checkbox`
   */
  checked?: boolean;

  setCustomValidity: (message: string) => void;
  checkValidity: () => boolean;

  onblur: () => void;
  oninput: () => void;
}

export type UseFormValidationOptions<T extends z.ZodObject> = {
  debounceTime?: number;
  updateMode?: boolean;

  /**
   * Values used for fields that are not included in the form,
   * but are required by the schema.
   */
  implicitDefaults?: Partial<z.infer<T>>;
};

export interface Field {
  ref: HTMLInputElement;
  schemaField: z.ZodTypeAny;
  dirty: boolean;
}

export const useFormValidation = <T extends z.ZodObject>(
  schema: T,
  options: UseFormValidationOptions<T> = {},
) => {
  const fields: Partial<Record<keyof z.infer<T>, Field>> = {};
  const [errors, setErrors] = createStore<
    Partial<Record<keyof z.infer<T>, string[]>>
  >({});

  const [canSubmit, setCanSubmit] = createSignal(options.updateMode ?? false);

  const preprocessValue = (field: Field) => {
    const { ref } = field;
    const value = ref.value;

    const inputType = normalizeInputType(
      ref.type,
      ref.inputMode as JSX.InputHTMLAttributes<HTMLInputElement>['inputMode'],
    );

    switch (inputType) {
      case 'checkbox':
        return field.ref.checked;

      case 'number':
      case 'range':
        return value === '' ? undefined : Number(value);

      case 'date':
        return value === '' || value === null ? undefined : new Date(value);

      default:
        if (typeof value === 'string') {
          if (value.trim() === '') return undefined;
          return value;
        }

        return value;
    }
  };

  const getFormData = (): Record<string, unknown> => {
    const entries = Object.entries(fields)
      .map(
        ([key, field]) =>
          [key, field ? preprocessValue(field) : undefined] as const,
      )
      .map(
        ([key, value]) =>
          [key, options.updateMode ? (value ?? null) : value] as const,
      );

    return { ...options.implicitDefaults, ...Object.fromEntries(entries) };
  };

  const setFieldErrors = (field: Field, errors: string[] | undefined) => {
    // @ts-expect-error
    setErrors(field.ref.name as keyof z.infer<T>, errors);
    field.ref.setCustomValidity(errors?.join(', ') ?? '');
    field.ref.checkValidity();
  };

  const runValidation = async () => {
    const data = getFormData();

    const result = await schema.safeParseAsync(data);

    if (result.success) {
      batch(() => {
        for (const field of Object.values(fields)) {
          if (!field) continue;

          setFieldErrors(field, undefined);
        }

        setCanSubmit(true);
      });
    } else {
      const fieldErrors = treeifyError(result.error).properties ?? {};

      batch(() => {
        for (const [key, field] of Object.entries(fields)) {
          const errorField = fieldErrors[key];

          if (!field) {
            console.warn(`No field found for name ${key}`);
            continue;
          }

          if (!field.dirty) {
            continue;
          }

          setFieldErrors(field, errorField?.errors);
        }

        setCanSubmit(false);
      });
    }

    return result;
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

    const field = { ref, schemaField, dirty: options.updateMode ?? false };
    fields[name as keyof z.infer<T>] = field;

    let timeoutRef: ReturnType<typeof setTimeout> | undefined;

    ref.onblur = () => {
      clearTimeout(timeoutRef);

      field.dirty = true;
      runValidation();
    };

    ref.oninput = () => {
      clearTimeout(timeoutRef);
      setCanSubmit(false);

      field.dirty = true;

      timeoutRef = setTimeout(() => {
        runValidation();
      }, options.debounceTime ?? 1000);
    };
  };

  const formSubmit = <R>(
    handler: (data: z.infer<T>) => Promise<R>,
    onSuccess?: (response: R) => void,
    onError?: (err: unknown) => void,
  ) => {
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const submitter = async (ev: SubmitEvent) => {
      ev.preventDefault();

      const result = await runValidation();

      if (!result) {
        return;
      }

      if (!result.success) {
        console.warn('Form submission blocked due to validation errors', {
          errors: unwrap(errors),
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await handler(result.data);
        onSuccess?.(response);
      } catch (err) {
        if (err instanceof TRPCClientError) {
          const parsedServerError = ZodLikeError.safeParse(err.message);

          if (parsedServerError.success) {
            const fieldErrors = parsedServerError.data.properties;

            batch(() => {
              for (const [key, errors] of Object.entries(fieldErrors)) {
                const field = fields[key as keyof z.infer<T>];

                if (!field) {
                  console.warn(`No field found for name ${key}`);
                  continue;
                }

                setFieldErrors(field, errors.errors);
              }
            });

            return;
          }
        }

        onError?.(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitter.isSubmitting = isSubmitting;

    return submitter;
  };

  const forceValidate = () => {
    for (const field of Object.values(fields)) {
      if (!field) continue;

      field.dirty = true;
    }

    return runValidation();
  };

  return {
    validate,
    errors,
    canSubmit,
    formSubmit,
    forceValidate,
  };
};
