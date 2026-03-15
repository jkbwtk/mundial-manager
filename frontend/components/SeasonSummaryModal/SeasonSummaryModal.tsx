import { Modal } from '#components/Modal';
import { SeasonPodium } from '#components/SeasonSummaryModal/SeasonPodium';
import { SummaryHeader } from '#components/SeasonSummaryModal/SummaryHeader';
import { StatPaginatorWidget } from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import style from './SeasonSummaryModal.module.scss';

export const SeasonSummary: Component = () => {
  return (
    <StatPaginatorWidget
      topLeftLabels="Season Summary"
      statType="season"
      component={Modal}
      // page={-1}
      class={style.container}
    >
      <SummaryHeader />
      <Divider class={style.dashedDivider} />
      <SeasonPodium />
    </StatPaginatorWidget>
  );
};
