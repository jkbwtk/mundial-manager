import { createMemo, createSignal, For, getOwner } from 'solid-js';
import { Button } from '#components/Button';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { Divider } from '#components/Widget';
import { useCalculatorHost } from '#flib/calculatorHost';
import { convertCalculatorFinishEventToMatch } from '#flib/legacyMatches';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryCalculatorUrl } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import type { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import style from './IframeTest.module.scss';

const SIMULATOR_PATH = '/tests/calculator-simulator-test';

const HostStateEnum = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  FAILED: 'FAILED',
} as const;

type HostState = (typeof HostStateEnum)[keyof typeof HostStateEnum];

interface CalculatorHostFrameProps {
  src: string;

  onFinishEvent: (event: CalculatorFinishEvent) => void;
  onStateChange: (state: HostState) => void;
}

const CalculatorHostFrame: Component<CalculatorHostFrameProps> = (props) => {
  let ref!: HTMLIFrameElement;

  useCalculatorHost({
    iframe: () => ref,
    onFinishEvent: props.onFinishEvent,
    onConnect: () => props.onStateChange(HostStateEnum.CONNECTED),
    onConnectError: (err) => {
      console.error('Calculator host connection error:', err);
      props.onStateChange(HostStateEnum.FAILED);
    },
  });

  return (
    <iframe
      ref={ref}
      src={props.src}
      title="Calculator Host Test"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export const IframeTest: Component = () => {
  const [, { open }] = useModal();
  const owner = getOwner();

  const calculatorUrl = createResilientAsync(queryCalculatorUrl);

  const [index, setIndex] = createSignal(0);
  const [state, setState] = createSignal<HostState>(HostStateEnum.CONNECTING);

  const urls = () => [SIMULATOR_PATH, calculatorUrl.latest ?? ''];
  const url = createMemo(() => urls()[index()] ?? '');

  const openMatchModal = (data: CalculatorFinishEvent) => {
    open({
      props: {
        component: MatchSaveConfirmModal,
        match: convertCalculatorFinishEventToMatch(data),
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const switchUrl = () => {
    setState(HostStateEnum.CONNECTING);
    setIndex((current) => (current + 1) % urls().length);
  };

  return (
    <div class={style.container}>
      <div class={style.controls}>
        <Button severity="secondary" onClick={switchUrl}>
          Next URL
        </Button>{' '}
        <strong>URL:</strong> <code>{url()}</code> <strong>Host:</strong>{' '}
        {state()}
      </div>
      <Divider />
      <div class={style.iframeContainer}>
        <For each={[url()]}>
          {(src) => (
            <CalculatorHostFrame
              src={src}
              onFinishEvent={openMatchModal}
              onStateChange={setState}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default IframeTest;
