import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createMemo, createSignal } from 'solid-js';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { ProgressBar } from '#components/ProgresBar';
import { Divider, Widget } from '#components/Widget';
import { type ClockUnit, createNow } from '#flib/clock';
import { getSeason } from '#flib/seasons';
import { formatDate } from '#shared/timeUtils';
import weekDayPlugin from '#shared/weekDayPlugin';
import style from './SeasonProgress.module.scss';

dayjs.extend(isoWeek);
dayjs.extend(weekDayPlugin);

type Granularity = 'second' | 'minute' | 'hour' | 'day' | 'workDay' | 'week';

type GranularityOption = DropdownOption<Granularity> & {
  tick: ClockUnit;
  unit: string;
  format: (value: number) => string;
  precision: number;
};

const granularityOptions = {
  second: {
    label: 'Second',
    value: 'second',
    tick: 'second',
    unit: 'second',
    format: (seconds) => `${seconds.toLocaleString()}`,
    precision: 4,
  },
  minute: {
    label: 'Minute',
    value: 'minute',
    tick: 'minute',
    unit: 'minute',
    format: (minutes) => `${minutes.toLocaleString()}`,
    precision: 3,
  },
  hour: {
    label: 'Hour',
    value: 'hour',
    tick: 'hour',
    unit: 'hour',
    format: (hours) => `${hours.toLocaleString()}`,
    precision: 2,
  },
  day: {
    label: 'Day',
    value: 'day',
    tick: 'day',
    unit: 'day',
    format: (days) => `${days.toLocaleString()}`,
    precision: 1,
  },
  workDay: {
    label: 'Work Day',
    value: 'workDay',
    tick: 'day',
    unit: 'work day',
    format: (days) => `${days.toLocaleString()}`,
    precision: 1,
  },
  week: {
    label: 'Week',
    value: 'week',
    tick: 'day',
    unit: 'week',
    format: (weeks) => `${weeks.toLocaleString()}`,
    precision: 1,
  },
} satisfies Record<Granularity, GranularityOption>;

export const SeasonProgress: Component = () => {
  const [granularity, setGranularity] = createSignal<Granularity>('workDay');
  const config = createMemo(() => granularityOptions[granularity()]);
  const now = createNow(() => config().tick);

  const season = createMemo(() => getSeason(now().unix()));
  const nextSeason = createMemo(() =>
    getSeason(season().endDate.add(1, 'day').unix()),
  );

  const stats = createMemo(() => {
    const seasonStart = season().startDate.subtract(1, 'day');

    const totalDuration = season().endDate.diff(seasonStart, granularity());
    const remainingDuration = Math.max(
      0,
      season().endDate.diff(now(), granularity()),
    );
    const elapsedDuration = totalDuration - remainingDuration;

    const daysUntilNextSeason = Math.max(
      0,
      nextSeason().startDate.diff(now(), 'days'),
    );

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
    <Widget
      topLeftLabels="Season Progress"
      topRightLabels={[
        <Dropdown
          value={granularity()}
          options={Object.values(granularityOptions)}
          onChange={setGranularity}
        />,
      ]}
      class={style.widget}
    >
      <div class={style.header}>
        <span class={style.label}>{season().label}</span>
        <span class={style.progress}>
          {stats().progress.toFixed(config().precision)}%
        </span>
      </div>

      <div class={style.dates}>
        <div>{formatDate(season().startDate.unix())}</div>
        <MaterialSymbol symbol="arrow_forward" color="primary" />
        <div>{formatDate(season().endDate.unix())}</div>
      </div>

      <ProgressBar min={0} max={100} value={stats().progress} />

      <div class={style.section}>
        <span>Progress:</span>
        <strong>
          {config().format(stats().elapsedDuration)} /{' '}
          {config().format(stats().totalDuration)} {config().unit}
          {stats().totalDuration === 1 ? '' : 's'}
        </strong>

        <span>Remaining:</span>
        <strong>
          {config().format(stats().remainingDuration)} {config().unit}
          {stats().remainingDuration === 1 ? '' : 's'}
        </strong>
      </div>
      <Divider />
      <div class={style.section}>
        <span>Next Season:</span>
        <strong> {nextSeason().label}</strong>

        <span>Starts in</span>
        <strong>
          {stats().daysUntilNextSeason}{' '}
          {stats().daysUntilNextSeason === 1 ? 'day' : 'days'}
        </strong>
      </div>
    </Widget>
  );
};
