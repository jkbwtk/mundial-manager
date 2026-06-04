import { debounce } from '@solid-primitives/scheduled';
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

export interface PickerEntry<T> {
  label: string;
  value: T;
}

export interface ResourcePickerProps<T = unknown, TR = unknown, TE = string> {
  query: (search: string) => Promise<T>;
  transform: (data: T) => Array<TR>;
  toEntry: (data: TR) => PickerEntry<TE>;
}

export const ResourcePicker = <T = unknown, TR = T, TE = string>(
  props: ResourcePickerProps<T, TR, TE>,
) => {
  let triggerRef!: HTMLButtonElement;
  let inputRef!: HTMLInputElement;

  const instanceId = createUniqueId();
  const menuId = `${instanceId}-menu`;
  const triggerId = `${instanceId}-trigger`;

  const [open, setOpen] = createSignal(true);
  const [searchInput, setSearchInput] = createSignal('');
  const searchInputDebounce = debounce((v: string) => setSearchInput(v), 300);

  const [data] = createResource(searchInput, props.query);

  const [picked, setPicked] = createSignal<PickerEntry<TE> | null>(null);

  const openMenu = () => {
    batch(() => {
      setOpen(true);
      setSearchInput('');
    });
  };

  const closeMenu = () => {
    setOpen(false);
  };

  const toggleOpen = () => {
    open() ? closeMenu() : openMenu();
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
        $ServerOnly={true}
      >
        <span class={style.content}>{picked()?.label}</span>
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
        class={style.menu}
        // aria-labelledby={triggerId}
        triggerRef={() => triggerRef}
        onClickOutside={closeMenu}
        matchTriggerWidth
      >
        <Input
          ref={inputRef}
          class={style.input}
          value={searchInput()}
          autocomplete="off"
          onInput={(ev) => {
            const target = ev.target as HTMLInputElement;
            searchInputDebounce(target.value);
          }}
        >
          <MaterialSymbol symbol="search" />
        </Input>

        <Suspense>
          <Show when={data()}>
            {(d) => (
              <For each={props.transform(d())}>
                {(instance) => {
                  const entry = props.toEntry(instance);

                  return (
                    <button
                      role="option"
                      type="button"
                      classList={{
                        [style.option]: true,
                        [style.selected]: entry.value === picked()?.value,
                      }}
                      onPointerUp={() => setPicked(entry)}
                    >
                      {entry.label}
                    </button>
                  );
                }}
              </For>
            )}
          </Show>
        </Suspense>
      </AnchoredPopup>
    </>
  );
};
