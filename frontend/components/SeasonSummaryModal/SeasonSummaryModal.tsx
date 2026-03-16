import { Modal } from '#components/Modal';
import { SeasonAwards } from '#components/SeasonSummaryModal/SeasonAwards';
import { SeasonLeaderboard } from '#components/SeasonSummaryModal/SeasonLeaderboard';
import { SeasonPodium } from '#components/SeasonSummaryModal/SeasonPodium';
import { SummaryHeader } from '#components/SeasonSummaryModal/SummaryHeader';
import { StatPaginatorWidget } from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import style from './SeasonSummaryModal.module.scss';

export interface SeasonSummaryModalProps {
  page?: number;
}

export const SeasonSummaryModal: Component<SeasonSummaryModalProps> = (
  props,
) => {
  return (
    <StatPaginatorWidget
      topLeftLabels="Season Summary"
      statType="season"
      component={Modal}
      page={props.page ?? -1}
      class={style.container}
    >
      <SummaryHeader />
      <Divider class={style.dashedDivider} />
      <SeasonPodium />
      <Divider class={style.dashedDivider} />
      <SeasonAwards />
      <Divider class={style.dashedDivider} />
      <SeasonLeaderboard />
    </StatPaginatorWidget>
  );
};
