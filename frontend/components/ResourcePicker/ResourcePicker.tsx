import {
  batch,
  createResource,
  createSignal,
  createUniqueId,
  For,
  Show,
  Suspense,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import style from './ResourcePicker.module.scss';

export interface ResourcePickerProps<T = unknown, TR = unknown> {
  query: () => Promise<T>;
  transform: (data: T) => Array<TR>;
  toEntry: (data: TR) => { label: string; value: string };
}

export const ResourcePicker = <T = unknown, TR = T>(
  props: ResourcePickerProps<T, TR>,
) => {
  let triggerRef!: HTMLButtonElement;
  let inputRef!: HTMLInputElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;

  const [open, setOpen] = createSignal(true);
  const [data] = createResource(() => props.query());

  const [searchInput, setSearchInput] = createSignal('');

  const filteredData = (data: TR[]) => {
    const search = searchInput().toLowerCase();

    if (!search) {
      return data;
    }

    return data.filter((entry) => {
      const { label } = props.toEntry(entry);
      return label.toLowerCase().includes(search);
    });
  };

  const toggleOpen = () => {
    const prev = open();

    if (prev) {
      setOpen(false);
      return;
    }

    batch(() => {
      setOpen(true);
      setSearchInput('');
    });
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        class={style.picker}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open()}
        aria-controls={menuId}
        onPointerUp={toggleOpen}
      >
        ResourcePicker component{' '}
        <span aria-hidden="true">
          <MaterialSymbol
            color="primary"
            symbol={open() ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
          />
        </span>
      </button>

      <AnchoredPopup
        id={menuId}
        open={open()}
        aria-labelledby={triggerId}
        triggerRef={() => triggerRef}
        onClickOutside={() => setOpen(false)}
        matchTriggerWidth
      >
        <Suspense>
          <Show when={data()}>
            {(d) => (
              <For each={filteredData(props.transform(d()))}>
                {(entry) => {
                  const { label } = props.toEntry(entry);

                  // return <div>{label}</div>;
                  return (
                    <button role="option" type="button" class={style.entry}>
                      {label}
                    </button>
                  );
                }}
              </For>
            )}
          </Show>
        </Suspense>
        <Input
          ref={inputRef}
          class={style.input}
          value={searchInput()}
          autocomplete="off"
          onInput={(ev) => {
            const target = ev.target as HTMLInputElement;
            setSearchInput(target.value);
          }}
        >
          <MaterialSymbol symbol="search" />
        </Input>
      </AnchoredPopup>
    </>
  );
};
