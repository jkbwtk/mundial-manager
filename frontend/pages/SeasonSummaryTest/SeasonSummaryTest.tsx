import { onCleanup, onMount } from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { SeasonSummary } from '#components/SeasonSummaryModal';
import { Widget } from '#components/Widget';
import { useModal } from '#providers/ModalProvider';
import style from './SeasonSummaryTest.module.scss';

export const SeasonSummaryTest: Component = () => {
  const [, { open }] = useModal();

  const openSummary = () => {
    return open({
      props: {
        component: SeasonSummary,
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
    <Widget topLeftLabels="SeasonSummary Modal Test" class={style.container}>
      <Break />
      <Button severity="primary" onPointerUp={openSummary}>
        Open Season Summary
      </Button>
    </Widget>
  );
};

export default SeasonSummaryTest;
