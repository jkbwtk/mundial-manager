import dayjs, { type Dayjs } from 'dayjs';
import { createMemo } from 'solid-js';
import { useStatPaginatedFrame } from '#components/StatPaginatorWidget';
import { StatRow } from '#components/StatRow';
import style from './SeasonSummaryModal.module.scss';

function unwrapDayjs(value: Dayjs) {
  //@ts-expect-error
  return dayjs(value.$d);
}

export const SummaryHeader: Component = () => {
  const frame = useStatPaginatedFrame();

  const season = createMemo(() => frame().season);

  return (
    <div class={style.headerContainer}>
      <div class={style.label}>{season().label}</div>

      <div class={style.dates}>
        {unwrapDayjs(season().startDate).format('MMM D, YYYY')} -{' '}
        {unwrapDayjs(season().endDate).format('MMM D, YYYY')}
      </div>

      <StatRow
        items={[
          { value: frame().seasonStats.matches, label: 'matches' },
          { value: frame().seasonStats.players.length, label: 'players' },
          { value: frame().seasonStats.goals, label: 'goals' },
          { value: frame().seasonStats.playtimeFormatted, label: 'played' },
        ]}
      />
    </div>
  );
};
