import type z from 'zod';

export interface UseFormValidationOptions {
  errorClass: string;
}

export const useFormValidation = <T extends z.ZodObject>(
  schema: T,
  options: UseFormValidationOptions,
) => {
  const fields: Record<string, { ref: HTMLInputElement }> = {};

  const validate = (ref: HTMLInputElement, name: string) => {
    console.log('run validate use', name);

    fields[ref.name] = { ref };

    ref.onblur = () => {
      console.log('blured');
    };

    ref.oninput = (ev) => {
      const value = (ev.target as HTMLInputElement).value;

      const result = schema.shape[name].safeParse(value);

      console.log(result);
    };
  };

  return {
    validate,
  };
};
