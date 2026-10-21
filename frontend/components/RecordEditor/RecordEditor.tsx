import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  type JSX,
  Match,
  on,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { KeyedFor } from '#components/KeyedFor';
import { MaterialSymbol } from '#components/MaterialSymbol';
import {
  applyDirectives,
  type ComponentUseDirectiveHack,
} from '#flib/solidHelpers';
import style from './RecordEditor.module.scss';

export type RecordEditorValueType = 'string' | 'number' | 'boolean' | 'null';

export type RecordEditorValue = string | number | boolean | null;

interface RecordEntry {
  id: string;
  key: string;
  type: RecordEditorValueType;
  value: RecordEditorValue | undefined;
}

export interface RecordEditorProps {
  name?: string;
  value?: Record<string, RecordEditorValue>;
  onChange?: (value: Record<string, RecordEditorValue>) => void;

  valueTypes?: RecordEditorValueType[];

  keyPlaceholder?: string;
  valuePlaceholder?: string;

  disabled?: boolean;
  invalid?: boolean;
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
  useDirectives?: ComponentUseDirectiveHack<HTMLInputElement>[];
}

const valueTypeOrder: RecordEditorValueType[] = [
  'string',
  'number',
  'boolean',
  'null',
];

const valueTypeLabels: Record<RecordEditorValueType, string> = {
  string: 'Aa',
  number: '12',
  boolean: 'TF',
  null: '--',
};

const getValueType = (value: RecordEditorValue): RecordEditorValueType =>
  value === null ? 'null' : (typeof value as RecordEditorValueType);

const convertValue = (
  value: RecordEditorValue | undefined,
  type: RecordEditorValueType,
): RecordEditorValue | undefined => {
  switch (type) {
    case 'string':
      return value === undefined || value === null ? undefined : String(value);

    case 'number': {
      if (typeof value === 'number') return value;
      if (typeof value !== 'string' || value.trim() === '') return undefined;

      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : undefined;
    }

    case 'boolean':
      return typeof value === 'boolean' ? value : false;

    case 'null':
      return null;

    default:
      throw new Error(`Unsupported record value type: ${type}`);
  }
};

const entriesFromValue = (
  value: Record<string, RecordEditorValue> | undefined,
) =>
  Object.entries(value ?? {}).map(
    ([key, entryValue]): RecordEntry => ({
      id: createUniqueId(),
      key,
      type: getValueType(entryValue),
      value: entryValue,
    }),
  );

export const RecordEditor: Component<RecordEditorProps> = (props) => {
  let containerRef!: HTMLDivElement;

  const [entries, setEntries] = createSignal<RecordEntry[]>(
    entriesFromValue(props.value),
  );

  const valueTypes = createMemo(() =>
    valueTypeOrder.filter((type) =>
      (props.valueTypes ?? ['number']).includes(type),
    ),
  );

  const currentValue = createMemo(() => {
    const result: Record<string, RecordEditorValue> = {};

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
      {
        id: createUniqueId(),
        key: '',
        type: valueTypes()[0] ?? 'number',
        value: undefined,
      },
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

  const updateValue = (id: string, value: RecordEditorValue | undefined) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, value } : entry)),
    );
  };

  const cycleType = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;

        const types = valueTypes();
        const type = types[(types.indexOf(entry.type) + 1) % types.length]!;

        return { ...entry, type, value: convertValue(entry.value, type) };
      }),
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
          <KeyedFor each={entries()} by={(entry) => entry.id}>
            {(entry) => {
              const isDuplicate = () => duplicateKeys().has(entry().key.trim());

              return (
                <div class={style.entry}>
                  <Input
                    classList={{ [style.keyInput]: true }}
                    type="text"
                    placeholder={props.keyPlaceholder ?? 'Key...'}
                    value={entry().key}
                    disabled={props.disabled}
                    invalid={isDuplicate() || isMissingKey(entry())}
                    onInput={(ev) =>
                      updateKey(entry().id, ev.currentTarget.value)
                    }
                    onBlur={notifyBlur}
                  />

                  <span class={style.separator}>→</span>

                  <div class={style.value}>
                    <Switch>
                      <Match when={entry().type === 'number'}>
                        <Input
                          classList={{ [style.valueInput]: true }}
                          type="number"
                          step="any"
                          placeholder={props.valuePlaceholder ?? 'Value...'}
                          value={(entry().value as number | undefined) ?? ''}
                          disabled={props.disabled}
                          invalid={isMissingValue(entry())}
                          onInput={(ev) => {
                            const raw = ev.currentTarget.value;

                            updateValue(
                              entry().id,
                              raw.trim() === '' ? undefined : Number(raw),
                            );
                          }}
                          onBlur={notifyBlur}
                        />
                      </Match>

                      <Match when={entry().type === 'string'}>
                        <Input
                          classList={{ [style.valueInput]: true }}
                          type="text"
                          placeholder={props.valuePlaceholder ?? 'Value...'}
                          value={(entry().value as string | undefined) ?? ''}
                          disabled={props.disabled}
                          invalid={isMissingValue(entry())}
                          onInput={(ev) => {
                            const raw = ev.currentTarget.value;

                            updateValue(
                              entry().id,
                              raw.trim() === '' ? undefined : raw,
                            );
                          }}
                          onBlur={notifyBlur}
                        />
                      </Match>

                      <Match when={entry().type === 'boolean'}>
                        <Input
                          type="checkbox"
                          checked={entry().value === true}
                          disabled={props.disabled}
                          onChange={(ev) =>
                            updateValue(entry().id, ev.currentTarget.checked)
                          }
                          onBlur={notifyBlur}
                        />
                      </Match>

                      <Match when={entry().type === 'null'}>
                        <span class={style.nullValue}>null</span>
                      </Match>
                    </Switch>
                  </div>

                  <Show when={valueTypes().length > 1}>
                    <Button
                      type="button"
                      severity="secondary"
                      padding={0}
                      class={style.typeButton}
                      aria-label={`Value type: ${entry().type}`}
                      title={entry().type}
                      disabled={props.disabled}
                      onClick={() => {
                        cycleType(entry().id);
                        notifyBlur();
                      }}
                    >
                      {valueTypeLabels[entry().type]}
                    </Button>
                  </Show>

                  <button
                    type="button"
                    class={style.removeButton}
                    disabled={props.disabled}
                    onClick={() => {
                      removeEntry(entry().id);
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
          </KeyedFor>
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
