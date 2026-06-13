import { debounce } from '@solid-primitives/scheduled';
import {
  createEffect,
  createResource,
  createSignal,
  For,
  getOwner,
  type JSX,
  on,
  runWithOwner,
  Suspense,
} from 'solid-js';
import { AnchoredPopup } from '#components/AnchoredPopup';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Paginator } from '#components/Paginator';
import { Spinner } from '#components/Spinner';
import type { PaginatedResponse } from '#shared/zod';
import style from './ResourcePicker.module.scss';

export interface PickerEntry<T> {
  label: string | JSX.Element;
  value: T;
  loading?: true;
}

export interface PickerQueryMeta {
  pagination?: {
    limit: number;
    offset: number;
  };
  search?: string;
}

interface ResourcePickerBaseProps<T, TE> {
  query: (meta?: PickerQueryMeta) => Promise<PaginatedResponse<T>>;
  toEntry: (data: T) => PickerEntry<TE>;

  menuId: string;
  triggerId: string;
  open: boolean;
  triggerRef: () => HTMLElement | undefined;

  onSelect(entry: PickerEntry<TE>): void;
  onClose(): void;

  isPicked: (value: TE) => boolean;
}

export const ResourcePickerBase = <T, TE = unknown>(
  props: ResourcePickerBaseProps<T, TE>,
) => {
  let inputRef!: HTMLInputElement;
  const owner = getOwner();

  const [activeIndex, setActiveIndex] = createSignal(-1);

  const [limit, setLimit] = createSignal(10);
  const [page, setPage] = createSignal(0);
  const [searchInput, setSearchInput] = createSignal('');
  const searchInputDebounce = debounce((v: string) => setSearchInput(v), 300);

  const queryMetaProp = (): PickerQueryMeta => ({
    pagination: {
      limit: limit(),
      offset: page() * limit(),
    },
    search: searchInput().trim(),
  });

  const [resp] = createResource(queryMetaProp, props.query);

  const toEntryWithOwner = (instance: T): PickerEntry<TE> => {
    const createEntry = () => props.toEntry(instance);
    if (!owner) return createEntry();
    return runWithOwner(owner, createEntry) ?? createEntry();
  };

  const moveActiveIndex = (delta: 1 | -1) => {
    const optionsCount = resp.latest?.data.length ?? 0;
    if (optionsCount === 0) return;

    const currentIndex = activeIndex();
    if (currentIndex < 0) {
      setActiveIndex(delta > 0 ? 0 : optionsCount - 1);
      return;
    }

    setActiveIndex((currentIndex + delta + optionsCount) % optionsCount);
  };

  const handleMenuKeyDown = (ev: KeyboardEvent) => {
    switch (ev.key) {
      case 'ArrowDown':
        ev.preventDefault();
        moveActiveIndex(1);
        break;
      case 'ArrowUp':
        ev.preventDefault();
        moveActiveIndex(-1);
        break;
      case 'Home':
        ev.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        ev.preventDefault();
        setActiveIndex((resp.latest?.data.length ?? 1) - 1);
        break;
      case 'Enter':
      case ' ': {
        ev.preventDefault();
        const index = activeIndex();
        const option = resp.latest?.data[index];

        if (option) props.onSelect(toEntryWithOwner(option));
        break;
      }
      case 'Escape':
        ev.preventDefault();
        props.onClose();
        break;
    }
  };

  createEffect(
    on([resp], () => {
      setActiveIndex(-1);
    }),
  );

  createEffect(
    on([() => props.open], ([open]) => {
      if (open) {
        setSearchInput('');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inputRef.focus();
          });
        });
      }
    }),
  );

  return (
    <AnchoredPopup
      id={props.menuId}
      open={props.open}
      class={style.menu}
      aria-labelledby={props.triggerId}
      triggerRef={props.triggerRef}
      onClickOutside={props.onClose}
      onKeyDown={handleMenuKeyDown}
      matchTriggerWidth
    >
      <Input
        ref={inputRef}
        class={style.input}
        value={searchInput()}
        placeholder="Search..."
        autocomplete="off"
        onInput={(ev) => {
          const target = ev.target as HTMLInputElement;
          searchInputDebounce(target.value);
        }}
      >
        <MaterialSymbol symbol="search" />
      </Input>

      <div class={style.optionContainer}>
        <Suspense fallback={<Spinner />}>
          <For each={resp.latest?.data}>
            {(instance, index) => {
              const entry = props.toEntry(instance);

              return (
                <button
                  role="option"
                  type="button"
                  classList={{
                    [style.option]: true,
                    [style.active]: index() === activeIndex(),
                    [style.picked]: props.isPicked(entry.value),
                  }}
                  onPointerUp={() => props.onSelect(entry)}
                  onPointerEnter={() => setActiveIndex(index())}
                >
                  {entry.label}
                </button>
              );
            }}
          </For>

          <Paginator
            class={style.paginator}
            total={resp.latest?.total ?? 0}
            limit={limit()}
            setLimit={setLimit}
            page={page()}
            setPage={setPage}
            keyboardNavigation
          />
        </Suspense>
      </div>
    </AnchoredPopup>
  );
};
