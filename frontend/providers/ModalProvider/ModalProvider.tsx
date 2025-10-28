import {
  createContext,
  For,
  Show,
  useContext,
  type ValidComponent,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { Dynamic, type DynamicProps, Portal } from 'solid-js/web';
import style from './ModalProvider.module.scss';

export interface ModalEntry<T extends ValidComponent = ValidComponent> {
  props: DynamicProps<T>;
  closeModal: (returnValue?: unknown) => void;
}

export interface ModalContextState {
  modals: ModalEntry[];
}

export interface ModalContextActions {
  open: <T extends ValidComponent>(
    modalProps: Omit<DynamicProps<T>, 'closeModal'>,
    afterClose?: (returnValue: unknown) => void,
  ) => {
    close: (returnValue?: unknown) => void;
  };
  closeAll: () => void;
}
export type ModalContextValue = [
  state: ModalContextState,
  actions: ModalContextActions,
];

const defaultState: ModalContextState = {
  modals: [],
};

const ModalContext = createContext<ModalContextValue>([
  structuredClone(defaultState),
  {
    open: () => {
      throw new Error('ModalContext: open() called before provider');
    },
    closeAll: () => {
      throw new Error('ModalContext: closeAll() called before provider');
    },
  },
]);

export const ModalProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<ModalContextState>(
    structuredClone(defaultState),
  );

  const closeFactory =
    (
      modalProps: DynamicProps<ValidComponent>,
      callback?: (returnValue?: unknown) => void,
    ) =>
    (returnValue?: unknown) => {
      setState('modals', (modals) =>
        modals.filter((m) => m.props !== modalProps),
      );
      callback?.(returnValue);
    };

  const open: ModalContextActions['open'] = (modalProps, callback) => {
    const entry: ModalEntry = {
      props: modalProps,
      closeModal: closeFactory(modalProps, callback),
    };

    setState('modals', (entries) => [...entries, entry]);

    return {
      close: entry.closeModal,
    };
  };

  const closeTop: ModalContextActions['closeAll'] = () => {
    const topModal = state.modals.at(-1);

    if (topModal) {
      topModal.closeModal();
    }
  };

  const closeAll: ModalContextActions['closeAll'] = () => {
    for (const modal of state.modals) {
      modal.closeModal();
    }
  };

  const handleBackgroundClick = (e: PointerEvent) => {
    if (e.target === e.currentTarget) {
      closeTop();
    }
  };

  return (
    <ModalContext.Provider value={[state, { open, closeAll }]}>
      {props.children}

      <Portal>
        <Show when={state.modals.length > 0}>
          <div class={style.modalContainer} onPointerUp={handleBackgroundClick}>
            <div class={style.backdrop} />
            <For each={state.modals}>
              {(entry) => (
                <Dynamic {...entry.props} closeModal={entry.closeModal} />
              )}
            </For>
          </div>
        </Show>
      </Portal>
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => useContext(ModalContext);
