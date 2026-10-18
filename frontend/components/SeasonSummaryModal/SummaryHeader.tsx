import { Show } from 'solid-js';
import { StatRow } from '#components/StatRow';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { formatDate, formatDuration } from '#shared/timeUtils';
import style from './SeasonSummaryModal.module.scss';
import type { SeasonSummaryData } from './seasonSummaryData';

export interface SummaryHeaderProps {
  data: SeasonSummaryData;
}

export const SummaryHeader: Component<SummaryHeaderProps> = (props) => {
  const timeZone = useLeagueTimeZone();

  const formatSeasonDate = (date: Date) => formatDate(date, timeZone());

  return (
    <div class={style.headerContainer}>
      <Show when={props.data.season()}>
        {(season) => (
          <>
            <div class={style.label}>{season().name}</div>

            <div class={style.dates}>
              {formatSeasonDate(season().startDate)} -{' '}
              {formatSeasonDate(season().endDate)}
            </div>
          </>
        )}
      </Show>

      <Show when={props.data.stats()}>
        {(stats) => (
          <StatRow
            items={[
              { value: stats().matches, label: 'matches' },
              { value: stats().players.length, label: 'players' },
              { value: stats().goals, label: 'goals' },
              { value: formatDuration(stats().playtime), label: 'played' },
            ]}
          />
        )}
      </Show>
    </div>
  );
};
