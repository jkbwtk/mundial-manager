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
import style from './FormsTest.module.scss';

hljs.registerLanguage('json', json);

const FormSchema = z.object({
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
    <Widget class={style.outerContainer} topLeftLabels="Form Component Tests">
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
          <span>String:</span>
          <Input
            name="string"
            minLength={3}
            maxLength={16}
            required
            useDirectives={[validate]}
            invalid={!!errors.string}
          />

          <span>Optional String:</span>
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

          <span>Integer:</span>
          <Input
            name="integer"
            type="number"
            min={0}
            step={1}
            required
            useDirectives={[validate]}
            invalid={!!errors.integer}
          />

          <span>Float:</span>
          <Input
            name="float"
            type="number"
            min={0}
            step="any"
            required
            useDirectives={[validate]}
            invalid={!!errors.float}
          />

          <span>Boolean:</span>
          <Input
            name="boolean"
            type="checkbox"
            useDirectives={[validate]}
            invalid={!!errors.boolean}
          />
        </form>
        <br />
      </Widget>

      <HighlightedCode language="json" code={`Errors: ${toJson(errors)}`} />
    </Widget>
  );
};

export default FormsTest;
