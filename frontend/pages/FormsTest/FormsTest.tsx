import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createUniqueId } from 'solid-js';
import z from 'zod';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Widget } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { toJson } from '#flib/index';
import 'highlight.js/styles/gml.min.css';
import { DateInput } from '#components/DateInput';
import { Required } from '#components/Required/Required';
import { hexColor } from '#shared/zod';
import style from './FormsTest.module.scss';

hljs.registerLanguage('json', json);

const FormSchema = z
  .object({
    string: z.string().trim().min(3).max(16),
    optionalString: z.string().trim().min(3).max(16).nullish(),
    optionalStringWithDefault: z
      .string()
      .trim()
      .min(3)
      .max(16)
      .nullish()
      .default('default value'),
    integer: z.number().int().nonnegative(),
    float: z.number().nonnegative(),
    boolean: z.boolean(),
    date: z.date(),
    color: hexColor,
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
    when: (payload) =>
      payload.issues.every((issue) => {
        const path = issue.path?.[0];
        return path !== 'password' && path !== 'confirmPassword';
      }),
  });

const fakeSubmit = (data: z.infer<typeof FormSchema>) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Form submitted with data:', data);
      resolve(true);
    }, 1000);
  });
};

export const FormsTest: Component = () => {
  const { validate, formSubmit, canSubmit, errors } = useFormValidation(
    FormSchema,
    {},
  );

  const formId = createUniqueId();
  const handleSubmit = formSubmit(fakeSubmit);

  return (
    <div class={style.outerContainer}>
      <Widget
        class={style.formContainer}
        bottomRightLabels={[
          <Button
            type="submit"
            form={formId}
            disabled={!canSubmit()}
            loading={handleSubmit.isSubmitting()}
          >
            Submit
          </Button>,
        ]}
      >
        <form id={formId} class={style.form} onSubmit={handleSubmit}>
          <span class={style.label}>
            String
            <Required />:
          </span>
          <Input
            name="string"
            minLength={3}
            maxLength={16}
            required
            useDirectives={[validate]}
            invalid={!!errors.string}
          />

          <span class={style.label}>Optional String:</span>
          <Input
            name="optionalString"
            minLength={3}
            maxLength={16}
            useDirectives={[validate]}
            invalid={!!errors.optionalString}
          />

          <span>Optional String with Default:</span>
          <Input
            name="optionalStringWithDefault"
            minLength={3}
            maxLength={16}
            useDirectives={[validate]}
            invalid={!!errors.optionalStringWithDefault}
          />

          <span class={style.label}>
            Integer
            <Required />:
          </span>
          <Input
            name="integer"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            required
            useDirectives={[validate]}
            invalid={!!errors.integer}
          />

          <span class={style.label}>
            Float
            <Required />:
          </span>
          <Input
            name="float"
            type="number"
            min={0}
            step={0.1}
            inputMode="decimal"
            required
            useDirectives={[validate]}
            invalid={!!errors.float}
          />

          <span class={style.label}>Boolean:</span>
          <Input
            name="boolean"
            type="checkbox"
            useDirectives={[validate]}
            invalid={!!errors.boolean}
          />

          <span class={style.label}>
            Color
            <Required />:
          </span>
          <Input
            name="color"
            type="color"
            required
            useDirectives={[validate]}
            invalid={!!errors.color}
          />

          <span class={style.label}>
            Date
            <Required />:
          </span>
          <DateInput
            name="date"
            useDirectives={[validate]}
            invalid={!!errors.date}
          />

          <span class={style.label}>
            Password
            <Required />:
          </span>
          <Input
            name="password"
            type="password"
            minLength={8}
            required
            useDirectives={[validate]}
            invalid={!!errors.password}
          />

          <span class={style.label}>
            Confirm Password
            <Required />:
          </span>
          <Input
            name="confirmPassword"
            type="password"
            minLength={8}
            required
            useDirectives={[validate]}
            invalid={!!errors.confirmPassword}
          />
        </form>
        <br />
      </Widget>

      <HighlightedCode language="json" code={`Errors: ${toJson(errors)}`} />
    </div>
  );
};

export default FormsTest;
