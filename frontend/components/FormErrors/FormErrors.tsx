import { createMemo, For, type JSX, Show } from 'solid-js';
import style from './FormErrors.module.scss';

export interface FormErrorsProps {
  errors: Partial<Record<string, string[]>>;
  warnings?: Partial<Record<string, string[]>>;

  fieldNames?: Record<string, string>;

  onFieldSelect?: (fieldName: string) => void;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

export const FormErrors: Component<FormErrorsProps> = (props) => {
  const fieldEntries = createMemo(() => {
    const fieldNames = new Set([
      ...Object.keys(props.errors),
      ...Object.keys(props.warnings ?? {}),
    ]);

    return [...fieldNames]
      .map((fieldName) => ({
        fieldName,
        errors: props.errors[fieldName] ?? [],
        warnings: props.warnings?.[fieldName] ?? [],
      }))
      .filter((entry) => entry.errors.length + entry.warnings.length > 0);
  });

  const hasValidationErrors = () => fieldEntries().length > 0;

  return (
    <div
      classList={{
        [style.container]: true,
        [props.class!]: !!props.class,

        ...(props.classList ?? {}),
      }}
    >
      <Show
        when={hasValidationErrors()}
        fallback={<span class={style.noErrors}>No validation errors</span>}
      >
        <div class={style.errors}>
          <For each={fieldEntries()}>
            {(entry) => {
              const displayFieldName =
                props.fieldNames?.[entry.fieldName] ?? entry.fieldName;

              return (
                <div class={style.error}>
                  <Show
                    when={props.onFieldSelect}
                    fallback={
                      <div class={style.fieldName}>{displayFieldName}:</div>
                    }
                  >
                    {(onFieldSelect) => (
                      <button
                        type="button"
                        classList={{
                          [style.fieldName]: true,
                          [style.selectable]: true,
                        }}
                        onClick={() => onFieldSelect()(entry.fieldName)}
                      >
                        {displayFieldName}:
                      </button>
                    )}
                  </Show>

                  <For each={entry.errors}>
                    {(error) => {
                      return <div class={style.errorDescription}> {error}</div>;
                    }}
                  </For>

                  <For each={entry.warnings}>
                    {(warning) => (
                      <div
                        classList={{
                          [style.errorDescription]: true,
                          [style.warningDescription]: true,
                        }}
                      >
                        {' '}
                        {warning}
                      </div>
                    )}
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
