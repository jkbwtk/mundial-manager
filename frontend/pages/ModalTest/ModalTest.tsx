import { createSignal } from 'solid-js';
import { Button } from '#components/Button';
import { Modal } from '#components/Modal';
import { Widget } from '#components/Widget';
import { useModal, useModalActions } from '#providers/ModalProvider';
import style from './ModalTest.module.scss';

const M: Component<{
  counter: number;
}> = (props) => {
  const [a, setA] = createSignal(0);
  const { closeModal } = useModalActions();

  return (
    <Modal topLeftLabels="Test Modal">
      Modal Content {a()}, counter {props.counter}
      <Button onClick={() => setA((v) => v + 1)}>Increment</Button>
      <Button onClick={() => closeModal('test')}>Close Modal</Button>
    </Modal>
  );
};

const ModalTest: Component = () => {
  const [, { open }] = useModal();
  const [counter, setCounter] = createSignal(0);

  const openModal = () => {
    const m = open({ component: M, counter: counter() }, (v) => {
      console.log(v);
    });

    setCounter((c) => c + 1);
  };

  return (
    <Widget topLeftLabels="Modal Test Page" class={style.container}>
      <br />
      Basic modal:
      <br />
      <Button severity="danger" onClick={openModal}>
        Open Basic Modal
      </Button>
    </Widget>
  );
};

export default ModalTest;
