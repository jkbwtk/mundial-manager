import { createContext, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { ModalEntry } from '#frontend/types';

export interface ModalContextActions {
  closeModal: (returnValue?: unknown) => void;
}

const ModalInstanceContext = createContext<ModalContextActions>({
  closeModal: () => {
    throw new Error(
      'ModalInstanceContext: closeModal() called before provider',
    );
  },
});

export const ModalInstanceProvider: ParentComponent<ModalEntry> = (props) => {
  const actions: ModalContextActions = {
    closeModal: props.closeModal,
  };

  return (
    <ModalInstanceContext.Provider value={actions}>
      <Dynamic {...props.props} />
    </ModalInstanceContext.Provider>
  );
};

export const useModalActions = (): ModalContextActions =>
  useContext(ModalInstanceContext);
