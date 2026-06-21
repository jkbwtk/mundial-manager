import { createMemo, For, type JSX, Show } from 'solid-js';
import style from './FormErrors.module.scss';

export interface FormErrorsProps {
  errors: Partial<Record<string, string[]>>;

  fieldNames?: Record<string, string>;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const FormErrors: Component<FormErrorsProps> = (props) => {
  const errorEntries = createMemo(() => Object.entries(props.errors));

  const hasValidationErrors = () => errorEntries().length > 0;

  return (
    <div
      classList={{
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
    >
      <Show
        when={hasValidationErrors()}
        fallback={<span class={style.noErrors}>No validation errors</span>}
      >
        <div class={style.errors}>
          <For each={errorEntries()}>
            {([fieldName, fieldErrors]) => {
              const displayFieldName =
                props.fieldNames?.[fieldName] ?? fieldName;

              return (
                <div class={style.error}>
                  <div class={style.fieldName}>{displayFieldName}:</div>

                  <For each={fieldErrors}>
                    {(error) => {
                      return <div class={style.errorDescription}> {error}</div>;
                    }}
                  </For>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
