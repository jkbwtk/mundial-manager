import { createContext, createRoot, onCleanup, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { ModalEntry } from '#frontend/types';
import { useModal } from '#providers/ModalProvider/ModalProvider';

export interface ModalInstanceContextActions {
  inModal: () => boolean;
  isTop: () => boolean;
  closeModal: (returnValue?: unknown) => void;
}

const ModalInstanceContext = createContext<ModalInstanceContextActions>({
  inModal: () => false,
  isTop: () => false,

  closeModal: () => {
    throw new Error(
      'ModalInstanceContext: closeModal() called before provider',
    );
  },
});

export const ModalInstanceProvider: ParentComponent<ModalEntry> = (props) => {
  const [state] = useModal();

  const inModal: ModalInstanceContextActions['inModal'] = () => true;

  const isTop: ModalInstanceContextActions['isTop'] = () => {
    return state.modals.at(-1)?.id === props.id;
  };

  const actions: ModalInstanceContextActions = {
    inModal,
    isTop,
    closeModal: props.closeModal,
  };

  const renderModal = () => (
    <ModalInstanceContext.Provider value={actions}>
      <Dynamic {...props.props} />
    </ModalInstanceContext.Provider>
  );

  const owner = props.owner();

  if (!owner) return renderModal();

  let disposeModal!: () => void;

  onCleanup(() => disposeModal());

  return createRoot((dispose) => {
    disposeModal = dispose;

    return renderModal();
  }, owner);
};

export const useModalActions = (): ModalInstanceContextActions =>
  useContext(ModalInstanceContext);
