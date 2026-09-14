import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  on,
  onMount,
  Show,
} from 'solid-js';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import style from './RecordEditor.module.scss';

interface RecordEntry {
  id: string;
  key: string;
  value: number | undefined;
}

export interface RecordEditorProps {
  name?: string;
  value?: Record<string, number>;
  onChange?: (value: Record<string, number>) => void;

  keyPlaceholder?: string;
  valuePlaceholder?: string;

  disabled?: boolean;
  invalid?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
}

const entriesFromValue = (value: Record<string, number> | undefined) =>
  Object.entries(value ?? {}).map(
    ([key, entryValue]): RecordEntry => ({
      id: createUniqueId(),
      key,
      value: entryValue,
    }),
  );

export const RecordEditor: Component<RecordEditorProps> = (props) => {
  let containerRef!: HTMLDivElement;

  const [entries, setEntries] = createSignal<RecordEntry[]>(
    entriesFromValue(props.value),
  );

  const currentValue = createMemo(() => {
    const result: Record<string, number> = {};

    for (const entry of entries()) {
      const key = entry.key.trim();

      if (key === '' || entry.value === undefined) continue;

      result[key] = entry.value;
    }

    return result;
  });

  const duplicateKeys = createMemo(() => {
    const counts = new Map<string, number>();

    for (const entry of entries()) {
      const key = entry.key.trim();

      if (key === '') continue;

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([key]) => key),
    );
  });

  const isMissingKey = (entry: RecordEntry) =>
    entry.key.trim() === '' && entry.value !== undefined;

  const isMissingValue = (entry: RecordEntry) =>
    entry.key.trim() !== '' && entry.value === undefined;

  const validationErrors = createMemo(() => {
    const messages = [...duplicateKeys()].map(
      (key) => `Duplicate key "${key}"`,
    );

    for (const entry of entries()) {
      if (isMissingKey(entry)) {
        messages.push(`Missing key for value ${entry.value}`);
      }

      if (isMissingValue(entry)) {
        messages.push(`Missing value for key "${entry.key.trim()}"`);
      }
    }

    return messages;
  });

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { id: createUniqueId(), key: '', value: undefined },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const updateKey = (id: string, key: string) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, key } : entry)),
    );
  };

  const updateValue = (id: string, value: number | undefined) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, value } : entry)),
    );
  };

  const notifyBlur = () => {
    containerRef.onblur?.(new FocusEvent('blur', { bubbles: true }));
  };

  createEffect(
    on(
      // Errors are tracked too, since incomplete rows do not change the value
      [currentValue, validationErrors],
      ([value]) => {
        props.onChange?.(value);

        containerRef.oninput?.(new InputEvent('input', { bubbles: true }));
      },
      { defer: true },
    ),
  );

  onMount(() => {
    // @ts-expect-error
    containerRef.setCustomValidity = () => {};
    // @ts-expect-error
    containerRef.reportValidity = () => true;
    // @ts-expect-error
    containerRef.checkValidity = () => true;
    // @ts-expect-error
    containerRef.getValidationErrors = validationErrors;

    // @ts-expect-error
    applyDirectives(containerRef, props.useDirectives ?? []);
  });

  return (
    <div
      ref={containerRef}
      classList={{
        [style.container]: true,
        [style.invalid]: !!props.invalid,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
      // @ts-expect-error
      prop:name={props.name}
      prop:value={currentValue()}
    >
      <Show when={entries().length > 0}>
        <div class={style.list}>
          <For each={entries()}>
            {(entry) => {
              const isDuplicate = () => duplicateKeys().has(entry.key.trim());

              return (
                <div class={style.entry}>
                  <Input
                    classList={{ [style.keyInput]: true }}
                    type="text"
                    placeholder={props.keyPlaceholder ?? 'Key...'}
                    value={entry.key}
                    disabled={props.disabled}
                    invalid={isDuplicate() || isMissingKey(entry)}
                    onInput={(ev) =>
                      updateKey(entry.id, ev.currentTarget.value)
                    }
                    onBlur={notifyBlur}
                  />

                  <span class={style.separator}>→</span>

                  <Input
                    classList={{ [style.valueInput]: true }}
                    type="number"
                    step="any"
                    placeholder={props.valuePlaceholder ?? 'Value...'}
                    value={entry.value ?? ''}
                    disabled={props.disabled}
                    invalid={isMissingValue(entry)}
                    onInput={(ev) => {
                      const raw = ev.currentTarget.value;

                      updateValue(
                        entry.id,
                        raw.trim() === '' ? undefined : Number(raw),
                      );
                    }}
                    onBlur={notifyBlur}
                  />

                  <button
                    type="button"
                    class={style.removeButton}
                    disabled={props.disabled}
                    onClick={() => {
                      removeEntry(entry.id);
                      notifyBlur();
                    }}
                  >
                    <MaterialSymbol
                      interactive
                      color="primary"
                      highlightColor="primary"
                      symbol="delete"
                    />
                  </button>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Button
        type="button"
        severity="secondary"
        class={style.addTrigger}
        disabled={props.disabled}
        onClick={addEntry}
      >
        +
      </Button>
    </div>
  );
};
