import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { createMemo, createSignal, Show } from 'solid-js';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { ProgressBar } from '#components/ProgresBar';
import { Divider, Widget } from '#components/Widget';
import { type ClockUnit, createNow } from '#flib/clock';
import { useSeasonLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { formatDate, toZonedDayjs } from '#shared/timeUtils';
import type { Season } from '#shared/types/api/season';
import { clamp } from '#shared/utils';
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
  const seasons = useSeasonLookup();

  const [granularity, setGranularity] = createSignal<Granularity>('workDay');
  const config = createMemo(() => granularityOptions[granularity()]);
  const now = createNow(() => config().tick);
  const timeZone = useLeagueTimeZone();
  const zonedNow = () => toZonedDayjs(now(), timeZone());

  const season = createMemo(
    () =>
      seasons
        .all()
        .find(
          (season) =>
            now().valueOf() >= season.startDate.getTime() &&
            now().valueOf() <= season.endDate.getTime(),
        ) ?? null,
  );
  const nextSeason = createMemo(
    () =>
      seasons
        .all()
        .filter((season) => season.startDate.getTime() > now().valueOf())
        .toSorted((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .at(0) ?? null,
  );

  const getProgress = (season: Season) => {
    const seasonStart = toZonedDayjs(season.startDate, timeZone()).subtract(
      1,
      'day',
    );
    const seasonEnd = toZonedDayjs(season.endDate, timeZone());

    const totalDuration = seasonEnd.diff(seasonStart, granularity());
    const remainingDuration = Math.max(
      0,
      seasonEnd.diff(zonedNow(), granularity()),
    );
    const elapsedDuration = totalDuration - remainingDuration;

    return {
      totalDuration,
      elapsedDuration,
      remainingDuration,
      progress: clamp(0, 100, (elapsedDuration / totalDuration) * 100),
    };
  };

  const daysUntil = (season: Season) =>
    Math.max(
      0,
      toZonedDayjs(season.startDate, timeZone()).diff(zonedNow(), 'days'),
    );

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
      <Show
        when={season()}
        fallback={<span class={style.noData}>No active season</span>}
      >
        {(season) => {
          const stats = createMemo(() => getProgress(season()));

          return (
            <>
              <div class={style.header}>
                <span class={style.label}>{season().name}</span>
                <span class={style.progress}>
                  {stats().progress.toFixed(config().precision)}%
                </span>
              </div>

              <div class={style.dates}>
                <div>{formatDate(season().startDate, timeZone())}</div>
                <MaterialSymbol symbol="arrow_forward" color="primary" />
                <div>{formatDate(season().endDate, timeZone())}</div>
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
            </>
          );
        }}
      </Show>

      <Divider />
      <div class={style.section}>
        <span>Next Season:</span>
        <strong> {nextSeason()?.name ?? 'None'}</strong>

        <Show when={nextSeason()}>
          {(next) => (
            <>
              <span>Starts in</span>
              <strong>
                {daysUntil(next())} {daysUntil(next()) === 1 ? 'day' : 'days'}
              </strong>
            </>
          )}
        </Show>
      </div>
    </Widget>
  );
};
