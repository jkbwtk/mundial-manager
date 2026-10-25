import { A } from '@solidjs/router';
import { type JSX, Show } from 'solid-js';
import { KeyedFor } from '#components/KeyedFor';
import { MatchSideLabel } from '#components/MatchSideLabel';
import { useMatchSummaryModal } from '#components/MatchSummaryModal';
import { Divider } from '#components/Widget';
import {
  formatUpcomingMatchTime,
  formatWinChances,
  getUpcomingMatches,
  UPCOMING_MATCHES_HREF,
  useActiveMatches,
  useLiveMatchPrediction,
  WIN_CHANCES_TITLE,
} from '#flib/activeMatches';
import { createNow } from '#flib/clock';
import { useTableLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import type { ActiveMatch } from '#shared/types/api/activeMatch';
import style from './LiveMatches.module.scss';
import { LiveMatchClock } from './LiveMatchParts';

export interface LiveMatchTickerProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface LiveMatchTickerRowProps {
  active: ActiveMatch;
}

const LIVE_MATCH_TICKER_ROWS = 3;

const LiveMatchTickerRow: Component<LiveMatchTickerRowProps> = (props) => {
  const tables = useTableLookup();
  const prediction = useLiveMatchPrediction(() => props.active);
  const openSummary = useMatchSummaryModal();

  return (
    <button
      type="button"
      class={style.tickerRow}
      onClick={() => openSummary(props.active.match.uuid)}
    >
      <span class={style.liveDot} aria-hidden="true">
        ●
      </span>
      <LiveMatchClock active={props.active} />
      <span classList={{ [style.dimmed]: true, [style.tickerTable]: true }}>
        {props.active.match.tableUuid
          ? tables.getLabel(props.active.match.tableUuid)
          : ''}
      </span>
      <MatchSideLabel
        match={props.active.match}
        side="SIDE_1"
        align="end"
        compact
      />
      <strong class={style.tickerScore}>
        {props.active.match.side1Score}:{props.active.match.side2Score}
      </strong>
      <MatchSideLabel match={props.active.match} side="SIDE_2" compact />
      <span class={style.dimmed} title={WIN_CHANCES_TITLE}>
        <Show when={prediction()}>
          {(current) => <>{formatWinChances(current().winProbability)}</>}
        </Show>
      </span>
    </button>
  );
};

export const LiveMatchTicker: Component<LiveMatchTickerProps> = (props) => {
  const matches = useActiveMatches();
  const timeZone = useLeagueTimeZone();
  const now = createNow(() => 'minute');

  const live = () =>
    matches()
      .filter((active) => active.match.status === 'ONGOING')
      .slice(0, LIVE_MATCH_TICKER_ROWS);

  const upcoming = () =>
    getUpcomingMatches(matches(), timeZone() ?? 'UTC', now().valueOf());

  const next = () =>
    upcoming().find(
      (entry) => entry.active.match.status === 'SCHEDULED' && !entry.overdue,
    );

  return (
    <div
      classList={{
        [style.ticker]: true,
        [props.class ?? '']: !!props.class,
        ...(props.classList ?? {}),
      }}
    >
      <div class={style.tickerRows}>
        <KeyedFor each={live()} by={(active) => active.match.uuid}>
          {(active) => <LiveMatchTickerRow active={active()} />}
        </KeyedFor>
      </div>

      <Show when={upcoming().length > 0}>
        <Divider
          direction="vertical"
          connect={0b00}
          class={style.tickerDivider}
        />

        <A
          href={UPCOMING_MATCHES_HREF}
          classList={{
            [style.upcomingCounter]: true,
            'no-style': true,
          }}
        >
          <span class={style.dimmed}>UPCOMING</span>
          <strong>{upcoming().length}</strong>
          <Show when={next()}>
            {(entry) => (
              <span class={style.dimmed}>
                next{' '}
                {formatUpcomingMatchTime(
                  entry(),
                  timeZone() ?? 'UTC',
                  now().valueOf(),
                )}
              </span>
            )}
          </Show>
        </A>
      </Show>
    </div>
  );
};
