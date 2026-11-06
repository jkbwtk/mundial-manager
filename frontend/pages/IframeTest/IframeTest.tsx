import { createMemo, createSignal, For } from 'solid-js';
import { Button } from '#components/Button';
import { Divider } from '#components/Widget';
import { useCalculatorHost } from '#flib/calculatorHost';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryCalculatorUrl } from '#flib/trpcCalls';
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

  onStateChange: (state: HostState) => void;
}

const CalculatorHostFrame: Component<CalculatorHostFrameProps> = (props) => {
  let ref!: HTMLIFrameElement;

  useCalculatorHost({
    iframe: () => ref,
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
  const calculatorUrl = createResilientAsync(queryCalculatorUrl);

  const [index, setIndex] = createSignal(0);
  const [state, setState] = createSignal<HostState>(HostStateEnum.CONNECTING);

  const urls = () => [SIMULATOR_PATH, calculatorUrl.latest ?? ''];
  const url = createMemo(() => urls()[index()] ?? '');

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
          {(src) => <CalculatorHostFrame src={src} onStateChange={setState} />}
        </For>
      </div>
    </div>
  );
};

export default IframeTest;
