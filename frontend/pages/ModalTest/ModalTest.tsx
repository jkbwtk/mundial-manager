import { createSignal } from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { InlineAction } from '#components/InlineAction';
import { Input } from '#components/Input';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Modal } from '#components/Modal';
import { Divider, Widget } from '#components/Widget';
import { useModal, useModalActions } from '#providers/ModalProvider';
import style from './ModalTest.module.scss';

const M: Component<{
  counter: number;
}> = (props) => {
  const [a, setA] = createSignal(0);
  const [inputValue, setInputValue] = createSignal('');
  const { closeModal } = useModalActions();

  return (
    <Modal
      topLeftLabels="Test Modal"
      topRightLabels="Closes modal ->"
      bottomLeftLabels="Footer Left"
      bottomRightLabels={['Footer Right', <MaterialSymbol symbol="atr" />]}
    >
      <div>Counter from parent: {props.counter}</div>
      <div>Local state: {a()}</div>
      <Divider />
      <div>Input field:</div>
      <Input
        value={inputValue()}
        onInput={(e) => setInputValue(e.currentTarget.value)}
        placeholder="Type something..."
      />
      <div>Current value: {inputValue()}</div>
      <Divider />
      <div>Buttons:</div>
      <Button onClick={() => setA((v) => v + 1)}>
        <MaterialSymbol symbol="arrow_upward" /> Increment
      </Button>
      <Button severity="secondary" onClick={() => setA(0)}>
        <MaterialSymbol symbol="swap_vert" /> Reset
      </Button>
      <Button severity="danger" onClick={() => closeModal('test')}>
        <MaterialSymbol symbol="check_box" /> Close Modal
      </Button>
      <Divider />
      <div>Inline action:</div>
      <InlineAction
        symbol="t"
        content="Press 't' or click"
        onAction={(type) => console.log('Action triggered:', type)}
      />
    </Modal>
  );
};

const ModalTest: Component = () => {
  const [, { open }] = useModal();
  const [counter, setCounter] = createSignal(0);

  const openModal = () => {
    open({ component: M, counter: counter() }, (v) => {
      console.log(v);
    });

    setCounter((c) => c + 1);
  };

  // onMount(() => {
  //   open({ component: M, counter: counter() });
  // });

  return (
    <Widget topLeftLabels="Modal Test Page" class={style.container}>
      <br />
      Basic modal:
      <br />
      <Button severity="danger" onClick={openModal}>
        Open Basic Modal
      </Button>
      <Break />
      {/* <M counter={0} /> */}
    </Widget>
  );
};

export default ModalTest;
