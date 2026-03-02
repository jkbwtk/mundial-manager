import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createMemo } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { ProgressBar } from '#components/ProgresBar';
import { Divider, Widget } from '#components/Widget';
import { getSeason } from '#flib/seasons';
import { formatDate } from '#flib/sheetUtils';
import style from './SeasonProgress.module.scss';

dayjs.extend(isoWeek);

const getWorkDays = (start: Dayjs, end: Dayjs) => {
  let count = 0;

  let current = start.startOf('day');
  const goal = end.startOf('day');

  while (current.isBefore(goal)) {
    const dayOfWeek = current.isoWeekday();

    if (dayOfWeek < 6) {
      count += 1;
    }

    current = current.add(1, 'day');
  }

  return count;
};

export const SeasonProgress: Component = () => {
  const season = getSeason(dayjs().unix());
  const nextSeason = getSeason(season.endDate.add(1, 'day').unix());

  const stats = createMemo(() => {
    const now = dayjs().startOf('day');

    const totalDuration = getWorkDays(season.startDate, season.endDate);
    const elapsedDuration = getWorkDays(season.startDate, now);
    const remainingDuration = getWorkDays(now, season.endDate);

    const daysUntilNextSeason = nextSeason.startDate.diff(now, 'days');

    const progress = Math.min(
      100,
      Math.max(0, (elapsedDuration / totalDuration) * 100),
    );

    return {
      totalDuration,
      elapsedDuration,
      remainingDuration,
      progress,

      daysUntilNextSeason,
    };
  });

  return (
    <Widget topLeftLabels="Season Progress" class={style.widget}>
      <div class={style.header}>
        <span class={style.label}>{season.label}</span>
        <span class={style.progress}>{stats().progress.toFixed(1)}%</span>
      </div>

      <div class={style.dates}>
        <div>{formatDate(season.startDate.unix())}</div>
        <MaterialSymbol symbol="arrow_forward" color="primary" />
        <div>{formatDate(season.endDate.unix())}</div>
      </div>

      <ProgressBar min={0} max={100} value={stats().progress} />

      <div class={style.section}>
        <span>Progress:</span>
        <strong>
          {stats().elapsedDuration} / {stats().totalDuration}{' '}
          {stats().totalDuration === 1 ? 'day' : 'days'}
        </strong>

        <span>Remaining:</span>
        <strong>
          {stats().remainingDuration}{' '}
          {stats().remainingDuration === 1 ? 'day' : 'days'}
        </strong>
      </div>
      <Divider />
      <div class={style.section}>
        <span>Next Season:</span>
        <strong> {nextSeason.label}</strong>

        <span>Starts in</span>
        <strong>
          {stats().daysUntilNextSeason}{' '}
          {stats().daysUntilNextSeason === 1 ? 'day' : 'days'}
        </strong>
      </div>
    </Widget>
  );
};
