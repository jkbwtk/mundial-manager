import { onCleanup, onMount } from 'solid-js';

import { Button } from '#components/Button';
import { SeasonSummaryModal } from '#components/SeasonSummaryModal';

import { useModal } from '#providers/ModalProvider';
import style from './SeasonSummaryTest.module.scss';

export const SeasonSummaryTest: Component = () => {
  const [, { open }] = useModal();

  const openSummary = () => {
    return open({
      props: {
        component: SeasonSummaryModal,
      },
    });
  };

  onMount(() => {
    const ref = openSummary();

    onCleanup(() => {
      ref.close();
    });
  });

  return (
    <div class={style.container}>
      <Button severity="primary" onPointerUp={openSummary}>
        Open Season Summary
      </Button>
    </div>
  );
};

export default SeasonSummaryTest;
