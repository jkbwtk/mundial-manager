import dayjs from 'dayjs';
import { Show } from 'solid-js';
import { Button } from '#components/Button';
import { SeasonSummaryModal } from '#components/SeasonSummaryModal';
import { Widget } from '#components/Widget';
import { getSeason } from '#flib/seasons';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './SeasonSummaryActivator.module.scss';

export const SeasonSummaryActivator: Component = () => {
  const [, { open }] = useModal();
  const [, { seasonStats }] = useSheets();

  const currentSeason = () => getSeason(dayjs().unix());
  const previousSeason = () =>
    getSeason(currentSeason().startDate.subtract(1, 'day').unix());

  const now = () => dayjs();
  const isAvailable = () =>
    now().diff(currentSeason().startDate, 'day') < 7 &&
    !!seasonStats()[previousSeason().number];

  const openSummary = () => {
    const page =
      Array.from(Object.keys(seasonStats())).length -
      Object.keys(seasonStats()).indexOf(previousSeason().number.toString()) -
      1;

    open({
      props: {
        component: SeasonSummaryModal,
        page,
      },
    });
  };

  return (
    <Show when={isAvailable()}>
      <Widget
        class={style.widget}
        // topLeftLabels={[
        //   <span>
        //     <MaterialSymbol symbol="trophy" color="yellow" filled />
        //     Season Summary
        //   </span>,
        // ]}
        bottomRightLabels={[
          <Button
            severity="primary"
            class={style.button}
            onPointerUp={openSummary}
          >
            Open
          </Button>,
        ]}
      >
        <div class={style.content}>
          Summary for <strong>{previousSeason().label}</strong> is available
        </div>
      </Widget>
    </Show>
  );
};
