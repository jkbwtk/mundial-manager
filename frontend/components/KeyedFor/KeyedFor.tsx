import { type Accessor, createMemo, For, type JSX, Show } from 'solid-js';

export interface KeyedForProps<T extends object> {
  each: readonly T[];
  by: (item: T) => string;

  children: (item: Accessor<T>, key: string) => JSX.Element;
}

export const KeyedFor = <T extends object>(props: KeyedForProps<T>) => {
  const itemsByKey = createMemo(
    () => new Map(props.each.map((item) => [props.by(item), item])),
  );

  const keys = createMemo(() => [...itemsByKey().keys()]);

  return (
    <For each={keys()}>
      {(key) => (
        <Show when={itemsByKey().get(key)}>
          {(item) => props.children(item, key)}
        </Show>
      )}
    </For>
  );
};
