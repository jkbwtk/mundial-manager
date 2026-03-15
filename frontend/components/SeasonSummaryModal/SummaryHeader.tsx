import dayjs, { type Dayjs } from 'dayjs';
import { createMemo } from 'solid-js';
import { useStatPaginatedFrame } from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
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

      <div class={style.stats}>
        <div class={style.stat}>
          <div class={style.statValue}> {frame().seasonStats.matches}</div>
          <div class={style.statLabel}>matches</div>
        </div>

        <Divider
          direction="vertical"
          connect={0b00}
          class={style.statDivider}
        />

        <div class={style.stat}>
          <div class={style.statValue}>
            {frame().seasonStats.players.length}
          </div>
          <div class={style.statLabel}>players</div>
        </div>

        <Divider
          direction="vertical"
          connect={0b00}
          class={style.statDivider}
        />

        <div class={style.stat}>
          <div class={style.statValue}>{frame().seasonStats.goals}</div>
          <div class={style.statLabel}>goals</div>
        </div>

        <Divider
          direction="vertical"
          connect={0b00}
          class={style.statDivider}
        />

        <div class={style.stat}>
          <div class={style.statValue}>
            {frame().seasonStats.playtimeFormatted}
          </div>
          <div class={style.statLabel}>played</div>
        </div>
      </div>
    </div>
  );
};
