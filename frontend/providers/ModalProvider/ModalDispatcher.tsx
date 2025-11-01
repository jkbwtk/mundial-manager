import { For, Portal, Show } from 'solid-js/web';
import { ModalInstanceProvider, useModal } from '#providers/ModalProvider';

import style from './ModalProvider.module.scss';

export const ModalDispatcher: ParentComponent = (props) => {
  const [state, { closeTop }] = useModal();

  const handleBackgroundClick = (e: PointerEvent) => {
    if (e.target === e.currentTarget) {
      closeTop();
    }
  };

  return (
    <>
      {props.children}

      <Portal>
        <Show when={state.modals.length > 0}>
          <div class={style.modalContainer} onPointerUp={handleBackgroundClick}>
            <div class={style.backdrop} />
            <For each={state.modals}>
              {(modal) => <ModalInstanceProvider {...modal} />}
            </For>
          </div>
        </Show>
      </Portal>
    </>
  );
};
