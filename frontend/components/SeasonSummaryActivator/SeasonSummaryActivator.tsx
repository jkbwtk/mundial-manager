import { createMemo, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { SeasonSummaryModal } from '#components/SeasonSummaryModal';
import { Widget } from '#components/Widget';
import { createNow } from '#flib/clock';
import { useSeasonLookup } from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryStatsPeriods } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import style from './SeasonSummaryActivator.module.scss';

const SUMMARY_AVAILABILITY_MS = 7 * 24 * 60 * 60 * 1000;

export const SeasonSummaryActivator: Component = () => {
  const [, { open }] = useModal();
  const owner = getOwner();
  const seasons = useSeasonLookup();
  const now = createNow(() => 'hour');

  const periods = createResilientAsync(
    () => 'SEASON' as const,
    queryStatsPeriods,
  );

  const previousSeason = createMemo(
    () =>
      seasons
        .all()
        .filter((season) => season.endDate.getTime() < now().valueOf())
        .toSorted((a, b) => b.endDate.getTime() - a.endDate.getTime())
        .at(0) ?? null,
  );

  const isAvailable = () => {
    const season = previousSeason();

    if (season === null || !periods.latest?.keys.includes(season.uuid)) {
      return false;
    }

    return now().valueOf() - season.endDate.getTime() < SUMMARY_AVAILABILITY_MS;
  };

  const openSummary = () => {
    open({
      props: {
        component: SeasonSummaryModal,
        seasonUuid: previousSeason()?.uuid,
      },
      owner,
    });
  };

  return (
    <Show when={isAvailable()}>
      <Widget
        class={style.widget}
        bottomRightLabels={[
          <Button severity="primary" class={style.button} onClick={openSummary}>
            Open
          </Button>,
        ]}
      >
        <div class={style.content}>
          Summary for <strong>{previousSeason()?.name}</strong> is available
        </div>
      </Widget>
    </Show>
  );
};
