import { createContext, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { ModalEntry } from '#frontend/types';

export interface ModalInstanceContextActions {
  closeModal: (returnValue?: unknown) => void;
}

const ModalInstanceContext = createContext<ModalInstanceContextActions>({
  closeModal: () => {
    throw new Error(
      'ModalInstanceContext: closeModal() called before provider',
    );
  },
});

export const ModalInstanceProvider: ParentComponent<ModalEntry> = (props) => {
  const actions: ModalInstanceContextActions = {
    closeModal: props.closeModal,
  };

  return (
    <ModalInstanceContext.Provider value={actions}>
      <Dynamic {...props.props} />
    </ModalInstanceContext.Provider>
  );
};

export const useModalActions = (): ModalInstanceContextActions =>
  useContext(ModalInstanceContext);
