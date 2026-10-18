import { createSignal, Show } from 'solid-js';
import { InlineAction } from '#components/InlineAction';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useSeasonLookup } from '#flib/entityLookup';
import { SeasonAwards } from './SeasonAwards';
import { SeasonLeaderboard } from './SeasonLeaderboard';
import { SeasonPodium } from './SeasonPodium';
import style from './SeasonSummaryModal.module.scss';
import { SummaryHeader } from './SummaryHeader';
import { createSeasonSummaryData } from './seasonSummaryData';

export interface SeasonSummaryModalProps {
  seasonUuid?: string;
}

export const SeasonSummaryModal: Component<SeasonSummaryModalProps> = (
  props,
) => {
  const seasons = useSeasonLookup();

  const [selected, setSelected] = createSignal(props.seasonUuid ?? null);

  const data = createSeasonSummaryData(selected);

  const step = (delta: number) => {
    const next = data.keys()[data.index() + delta];

    if (next !== undefined) setSelected(next);
  };

  return (
    <Modal
      class={style.container}
      topLeftLabels="Season Summary"
      bottomRightLabels={
        <Show when={data.season()}>
          {(season) => (
            <span>
              <InlineAction
                content="<"
                symbol="ArrowLeft"
                onAction={() => step(-1)}
              />{' '}
              {seasons.getLabel(season().uuid)}{' '}
              <InlineAction
                content=">"
                symbol="ArrowRight"
                onAction={() => step(1)}
              />
            </span>
          )}
        </Show>
      }
    >
      <div
        classList={{ [style.content]: true, [style.pending]: data.pending() }}
      >
        <SummaryHeader data={data} />
        <Divider class={style.dashedDivider} />
        <SeasonPodium data={data} />
        <Divider class={style.dashedDivider} />
        <SeasonAwards data={data} />
        <Divider class={style.dashedDivider} />
        <SeasonLeaderboard data={data} />
      </div>
    </Modal>
  );
};
