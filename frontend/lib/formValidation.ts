import { TRPCClientError } from '@trpc/client';
import { batch, createSignal, type JSX } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import type z from 'zod';
import { treeifyError } from 'zod';
import { normalizeInputType } from '#flib/utils';
import {
  getNestedErrors,
  resolveSchemaField,
  setPath,
  ZodLikeError,
} from '#shared/zod';

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

export type UseFormValidationOptions = {
  debounceTime?: number;
  updateMode?: boolean;

  implicitDefaults?: Record<string, unknown>;
};

export interface Field {
  ref: HTMLInputElement;
  schemaField: z.ZodTypeAny;
  dirty: boolean;
}

export const useFormValidation = <T extends z.ZodObject>(
  schema: T,
  options: UseFormValidationOptions = {},
) => {
  const fields: Record<string, Field> = {};
  const [errors, setErrors] = createStore<Partial<Record<string, string[]>>>(
    {},
  );

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
    const result: Record<string, unknown> = {};

    for (const [path, value] of Object.entries(
      options.implicitDefaults ?? {},
    )) {
      setPath(result, path.split('.'), value);
    }

    for (const [path, field] of Object.entries(fields)) {
      const value = preprocessValue(field);

      setPath(
        result,
        path.split('.'),
        options.updateMode ? (value ?? null) : value,
      );
    }

    return result;
  };

  const setFieldErrors = (field: Field, errors: string[] | undefined) => {
    setErrors(field.ref.name, errors);
    field.ref.setCustomValidity(errors?.join(', ') ?? '');
    field.ref.checkValidity();
  };

  const setPathErrors = (path: string, errors: string[] | undefined) => {
    const field = fields[path];

    if (field) {
      setFieldErrors(field, errors);
      return;
    }

    setErrors(path, errors);
  };

  const clearUnregisteredErrors = () => {
    for (const path of Object.keys(errors)) {
      if (!(path in fields)) {
        setErrors(path, undefined);
      }
    }
  };

  const runValidation = async () => {
    const data = getFormData();

    const result = await schema.safeParseAsync(data);

    if (result.success) {
      batch(() => {
        clearUnregisteredErrors();

        for (const field of Object.values(fields)) {
          setFieldErrors(field, undefined);
        }

        setCanSubmit(true);
      });
    } else {
      const errorTree = treeifyError(result.error);

      batch(() => {
        clearUnregisteredErrors();

        for (const [path, field] of Object.entries(fields)) {
          if (!field.dirty) {
            continue;
          }

          setFieldErrors(field, getNestedErrors(errorTree, path.split('.')));
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

    const schemaField = resolveSchemaField(schema, name.split('.'));

    if (schemaField === undefined) {
      console.warn(
        `Provided schema does not contain a field with the name ${name}`,
      );
      return;
    }

    const field = { ref, schemaField, dirty: options.updateMode ?? false };
    fields[name] = field;

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

          const fieldErrors = parsedServerError.success
            ? Object.entries(parsedServerError.data.properties)
            : [];

          if (fieldErrors.length > 0) {
            batch(() => {
              for (const [path, { errors }] of fieldErrors) {
                setPathErrors(path, errors);
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
