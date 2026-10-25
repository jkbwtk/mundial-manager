import { getOwner } from 'solid-js';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { useCalculatorHost } from '#flib/calculatorHost';
import { convertCalculatorFinishEventToMatch } from '#flib/legacyMatches';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryCalculatorUrl } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import style from './MundialCalculator.module.scss';

const MundialCalculator: Component = () => {
  const [, { open }] = useModal();
  const [, actions] = useToast();
  const owner = getOwner();

  const calculatorUrl = createResilientAsync(queryCalculatorUrl);

  let iframeRef!: HTMLIFrameElement;

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

  useCalculatorHost({
    iframe: () => iframeRef,
    onFinishEvent: openMatchModal,
    onConnect: () =>
      actions.info('Connection with calculator successful', {
        duration: 1000,
      }),
    onConnectError: (err) => {
      console.error('Calculator connection error:', err);
      actions.error('Failed to connect to the calculator');
    },
  });

  return (
    <iframe
      ref={iframeRef}
      src={calculatorUrl.latest}
      title="Mundial Calculator"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export default MundialCalculator;
