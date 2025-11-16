import { onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { MatchSaveConfirmModal } from '#components/MatchSaveConfirmModal';
import { convertCalculatorFinishEventToMatch } from '#flib/sheetUtils';
import { useModal } from '#providers/ModalProvider';
import { CalculatorFinishEvent } from '#shared/types/MundialCalculator';
import style from './MundialCalculator.module.scss';

const URL = import.meta.env.VITE_CALCULATOR_URL;

const MundialCalculator: Component = () => {
  const [, { open }] = useModal();

  const openMatchModal = (data: CalculatorFinishEvent) => {
    open({
      props: {
        component: MatchSaveConfirmModal,
        match: convertCalculatorFinishEventToMatch(data),
      },
    });
  };

  const handleMessage = (ev: MessageEvent) => {
    const parsed = CalculatorFinishEvent.safeParse(ev.data);

    if (parsed.success) {
      openMatchModal(parsed.data);
    } else {
      console.error(parsed.error);
    }
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
    <iframe
      src={URL}
      title="Mundial Calculator"
      class={style.iframe}
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  );
};

export default MundialCalculator;
