import {
  createContext,
  createEffect,
  createUniqueId,
  on,
  useContext,
  type ValidComponent,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { ModalEntry, ModalOpenOptions } from '#frontend/types';
import style from './ModalProvider.module.scss';

export interface ModalContextState {
  modals: ModalEntry[];
}

export interface ModalContextActions {
  open: <T extends ValidComponent>(
    options: ModalOpenOptions<T>,
  ) => {
    close: (returnValue?: unknown) => void;
  };
  closeTop: () => void;
  closeAll: () => void;
  isActive: () => boolean;
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
    closeTop: () => {
      throw new Error('ModalContext: closeTop() called before provider');
    },
    closeAll: () => {
      throw new Error('ModalContext: closeAll() called before provider');
    },
    isActive: () => {
      throw new Error('ModalContext: isActive() called before provider');
    },
  },
]);

export const ModalProvider: ParentComponent = (props) => {
  const [state, setState] = createStore<ModalContextState>(
    structuredClone(defaultState),
  );

  const closeFactory =
    (id: string, callback?: (returnValue?: unknown) => void) =>
    (returnValue?: unknown) => {
      setState('modals', (modals) => modals.filter((m) => m.id !== id));
      callback?.(returnValue);
    };

  const open: ModalContextActions['open'] = (options) => {
    const id = createUniqueId();
    const owner = options.owner ?? null;

    const entry: ModalEntry = {
      id,
      props: options.props,
      owner: () => owner,
      closeModal: closeFactory(id, options.afterClose),
      closeOnBackgroundClick: options.closeOnBackgroundClick ?? true,
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

  const isActive: ModalContextActions['isActive'] = () =>
    state.modals.length > 0;

  createEffect(() => {
    on(
      () => isActive(),
      (active) => {
        if (active) {
          document.body.classList.add(style.modalActive);
        } else {
          document.body.classList.remove(style.modalActive);
        }
      },
    );
  });

  return (
    <ModalContext.Provider
      value={[state, { open, closeTop, closeAll, isActive }]}
    >
      <div
        inert={state.modals.length > 0}
        aria-hidden={state.modals.length > 0}
        aria-disabled={state.modals.length > 0}
        classList={{
          [style.unfocusBackground]: state.modals.length > 0,
        }}
      >
        {props.children}
      </div>
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextValue => useContext(ModalContext);
