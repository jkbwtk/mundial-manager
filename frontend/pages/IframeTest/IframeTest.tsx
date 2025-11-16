import { createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { Divider, Widget } from '#components/Widget';
import { convertCalculatorFinishEventToMatch } from '#flib/sheetUtils';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import style from './IframeTest.module.scss';

const AVAILABLE_URLS = [
  import.meta.env.VITE_CALCULATOR_URL,
  'http://localhost:4200/tests/iframe-test',
  'http://127.0.0.1/tests/iframe-test',
];

const IframeTest: Component = () => {
  const [sheets, { latest }] = useSheets();
  const [, { open }] = useModal();

  // biome-ignore lint/style/useConst: yeah
  let ref: HTMLIFrameElement = null!;
  const [index, setIndex] = createSignal(0);

  const url = () => AVAILABLE_URLS[index()];

  const openMatchModal = (data: CalculatorFinishEvent) => {
    open({
      props: {
        component: MatchSaveConfirmModal,
        match: convertCalculatorFinishEventToMatch(data),
      },
    });
  };

  const handleMessage = (ev: MessageEvent) => {
    console.log(ev);

    const parsed = CalculatorFinishEvent.safeParse(ev.data);

    if (parsed.success) {
      console.log('Received CalculatorFinishEvent from iframe:', parsed.data);

      openMatchModal(parsed.data);
    } else {
      console.log(parsed.error);
    }
  };

  const sendMessage = () => {
    ref.contentWindow?.postMessage({ info: 'Test message' }, '*');
  };

  const sendPlayers = () => {
    const players = latest().matchStats.generalStats.uniquePlayers;
    ref.contentWindow?.postMessage({ players }, '*');
  };

  const sendToParent = () => {
    window.parent.postMessage({ info: 'iframe test message' }, '*');
  };

  onMount(() => {
    if (isServer === false) {
      window.addEventListener('message', handleMessage);
    }
  });

  onCleanup(() => {
    if (isServer === false) {
      window.removeEventListener('message', handleMessage);
    }
  });

  return (
    <Widget topLeftLabels="Iframe Test Page" class={style.container}>
      <div class={style.controls}>
        <Button
          severity="secondary"
          onClick={() => setIndex((i) => (i + 1) % AVAILABLE_URLS.length)}
        >
          Next URL
        </Button>{' '}
        <strong>URL:</strong> <code>{url()}</code>
        <Break />
        <Button severity="secondary" onClick={sendMessage}>
          Send Message
        </Button>
        <Button
          severity="secondary"
          disabled={sheets.ready === false}
          onClick={sendPlayers}
        >
          Send Players
        </Button>
        <Button severity="secondary" onClick={sendToParent}>
          Send to Parent
        </Button>
      </div>
      <Divider />
      <div class={style.iframeContainer}>
        <iframe
          ref={ref}
          src={url()}
          title="Test Iframe"
          class={style.iframe}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </Widget>
  );
};

export default IframeTest;
