import { revalidate } from '@solidjs/router';
import { createEffect, createMemo, getOwner, on, Show } from 'solid-js';
import { Button } from '#components/Button';
import { LiveMatchClock, LiveWinBar } from '#components/LiveMatches';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Modal } from '#components/Modal';
import { Spinner } from '#components/Spinner';
import { StatRow } from '#components/StatRow';
import {
  getSortedLineup,
  useActiveMatches,
  useLiveMatchPrediction,
} from '#flib/activeMatches';
import { useTableLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { formatElapsed } from '#flib/matchEvents';
import {
  createMatchTimelineLookup,
  type MatchTimelineLookup,
} from '#flib/matchTimelineLookup';
import { createResilientAsync, ResilientSkip } from '#flib/resilientAsync';
import {
  queryMatchPreview,
  queryMatchTimeline,
  queryPeriodStats,
} from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import {
  formatKnownStartDatetime,
  getExactStartDate,
} from '#shared/matchLabels';
import {
  getMatchRatedScore,
  getMatchTimelineStats,
  getMatchTimelineSteps,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type { ActiveMatch } from '#shared/types/api/activeMatch';
import type { MatchStatus } from '#shared/types/api/match';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';
import type { MatchPreview, PeriodStats } from '#shared/types/api/stats';
import style from './MatchSummaryModal.module.scss';
import {
  type MatchSummaryMode,
  MatchSummaryModeEnum,
  MatchSummarySide,
} from './MatchSummarySide';

export interface MatchSummaryModalProps {
  matchUuid: string;
}

interface MatchSummaryProps {
  timeline: MatchTimeline;
  active: ActiveMatch;
  mode: MatchSummaryMode;

  stats: PeriodStats | null;
  preview: MatchPreview | null;
}

interface MatchSummaryScoreProps {
  lookup: MatchTimelineLookup;
  side: MatchSide;
  score: number;
  winner: boolean;
}

const MatchSummaryStatusLabels: Record<MatchStatus, string> = {
  SCHEDULED: 'Scheduled',
  ONGOING: 'Live',
  PAUSED: 'Paused',
  FINISHED: 'Full Time',
  SURRENDERED: 'Surrendered',
  CANCELED: 'Cancelled',
};

const MatchSummaryModes: Record<MatchStatus, MatchSummaryMode> = {
  SCHEDULED: MatchSummaryModeEnum.PREVIEW,
  ONGOING: MatchSummaryModeEnum.LIVE,
  PAUSED: MatchSummaryModeEnum.LIVE,
  FINISHED: MatchSummaryModeEnum.FINAL,
  SURRENDERED: MatchSummaryModeEnum.FINAL,
  CANCELED: MatchSummaryModeEnum.FINAL,
};

const HOUR_MS = 60 * 60_000;

function formatPlannedOffset(startDate: Date, now: number): string {
  const offset = startDate.getTime() - now;
  const hours = Math.floor(Math.abs(offset) / HOUR_MS);
  const minutes = Math.round((Math.abs(offset) % HOUR_MS) / 60_000);
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return offset >= 0 ? `in ${label}` : `${label} ago`;
}

const MatchSummaryScore: Component<MatchSummaryScoreProps> = (props) => (
  <span
    classList={{ [style.sideScore]: true, [style.winner]: props.winner }}
    style={{ '--team-color': props.lookup.getSideColor(props.side) }}
  >
    {props.score}
  </span>
);

const MatchSummary: Component<MatchSummaryProps> = (props) => {
  const timeZone = useLeagueTimeZone();
  const tables = useTableLookup();
  const lookup = createMatchTimelineLookup(() => props.timeline);
  const prediction = useLiveMatchPrediction(
    () => props.active,
    () => props.mode === MatchSummaryModeEnum.LIVE,
    () =>
      props.mode === MatchSummaryModeEnum.PREVIEW
        ? (props.preview?.prediction ?? null)
        : null,
  );

  const match = () => props.timeline.match;
  const winner = () => getMatchWinningSide(match(), props.timeline.events);
  const stats = createMemo(() =>
    getMatchTimelineStats(props.timeline.events, match().duration),
  );

  const surrender = createMemo(() => {
    if (match().status !== 'SURRENDERED') return null;

    const step = getMatchTimelineSteps(props.timeline.events).find(
      ({ event }) => event.type === 'SURRENDER',
    );

    if (step?.event.type !== 'SURRENDER') return null;

    return {
      side: step.event.side,
      elapsed: step.activeElapsed,
      score: getMatchRatedScore(
        match(),
        props.timeline.events,
        props.timeline.rules,
      ),
    };
  });

  const winProbability = () => {
    const current = prediction();

    if (current === null) return null;

    return props.mode === MatchSummaryModeEnum.LIVE
      ? current.winProbability
      : current.preMatchWinProbability;
  };

  const plannedOffset = () => {
    const startDate = getExactStartDate(match());

    return startDate && formatPlannedOffset(startDate, Date.now());
  };

  return (
    <div class={style.container}>
      <MatchSummarySide
        lookup={lookup}
        side="SIDE_1"
        mode={props.mode}
        stats={props.stats}
        prediction={prediction()}
        winProbability={winProbability()}
        preview={props.preview}
      />

      <div class={style.scoreboard}>
        <span
          classList={{
            [style.status]: true,
            [style.live]: match().status === 'ONGOING',
            [style.cancelled]: match().status === 'CANCELED',
            [style.surrendered]: match().status === 'SURRENDERED',
          }}
        >
          <Show when={match().status === 'ONGOING'}>
            <span class={style.liveDot} aria-hidden="true">
              ●
            </span>{' '}
          </Show>
          {MatchSummaryStatusLabels[match().status]}
        </span>

        <Show when={props.mode !== MatchSummaryModeEnum.PREVIEW}>
          <div class={style.score}>
            <MatchSummaryScore
              lookup={lookup}
              side="SIDE_1"
              score={match().side1Score}
              winner={winner() === 'SIDE_1'}
            />
            <span aria-hidden="true">:</span>
            <MatchSummaryScore
              lookup={lookup}
              side="SIDE_2"
              score={match().side2Score}
              winner={winner() === 'SIDE_2'}
            />
          </div>
        </Show>

        <Show
          when={props.mode === MatchSummaryModeEnum.LIVE}
          fallback={
            <span class={style.date}>
              {formatKnownStartDatetime(match(), timeZone())}
              <Show
                when={
                  props.mode === MatchSummaryModeEnum.PREVIEW && plannedOffset()
                }
              >
                {(offset) => <> ({offset()})</>}
              </Show>
            </span>
          }
        >
          <LiveMatchClock active={props.active} />
        </Show>

        <Show
          when={props.mode !== MatchSummaryModeEnum.FINAL && winProbability()}
        >
          {(probability) => (
            <div class={style.winLine}>
              <span>{Math.round(probability() * 100)}%</span>
              <LiveWinBar active={props.active} probability={probability()} />
              <span>{Math.round((1 - probability()) * 100)}%</span>
            </div>
          )}
        </Show>

        <Show when={props.mode !== MatchSummaryModeEnum.FINAL && prediction()}>
          {(current) => (
            <span class={style.date}>
              expected {current().expectedScore.score[0]} :{' '}
              {current().expectedScore.score[1]}
            </span>
          )}
        </Show>

        <Show when={surrender()}>
          {(current) => (
            <div class={style.surrenderNote}>
              <span>
                <MaterialSymbol symbol="flag" color="yellow" />{' '}
                <strong>
                  {lookup
                    .getSortedSidePlayers(current().side)
                    .map(lookup.getPlayerName)
                    .join(' ')}
                </strong>{' '}
                surrendered at {formatElapsed(current().elapsed)}
              </span>

              <span class={style.date}>
                rated as {current().score[0]} : {current().score[1]}
                <Show when={props.timeline.rules.surrenderPenalty > 0}>
                  {' '}
                  (+{props.timeline.rules.surrenderPenalty} penalty)
                </Show>
              </span>
            </div>
          )}
        </Show>

        <Show
          when={props.mode === MatchSummaryModeEnum.PREVIEW}
          fallback={
            <StatRow
              items={[
                ...(props.mode === MatchSummaryModeEnum.FINAL
                  ? [
                      {
                        value: formatDuration(match().duration),
                        label: 'duration',
                      },
                    ]
                  : []),
                {
                  value: match().side1Score + match().side2Score,
                  label: 'goals',
                },
                { value: stats().counts.BALL_OUT ?? 0, label: 'ball outs' },
                {
                  value: stats().counts.POSITION_CHANGE ?? 0,
                  label: 'pos. changes',
                },
              ]}
            />
          }
        >
          <div class={style.preview}>
            <Show when={match().tableUuid}>
              {(uuid) => (
                <span>
                  <span class={style.date}>Table:</span>{' '}
                  <strong>{tables.getLabel(uuid())}</strong>
                </span>
              )}
            </Show>

            <Show when={match().stakesModifier > 1}>
              <span>
                <span class={style.date}>Stakes:</span>{' '}
                <strong>×{match().stakesModifier}</strong>
              </span>
            </Show>

            <Show when={props.preview}>
              {(preview) => (
                <Show
                  when={preview().headToHead.last}
                  fallback={
                    <span class={style.date}>These sides never met</span>
                  }
                >
                  {(last) => (
                    <span>
                      <span class={style.date}>Head-to-head:</span>{' '}
                      <strong>
                        {preview().headToHead.wins}W{' '}
                        {preview().headToHead.draws}D{' '}
                        {preview().headToHead.losses}L
                      </strong>{' '}
                      <span class={style.date}>
                        last {last().score[0]}:{last().score[1]}
                        <Show when={last().startDate}>
                          {(startDate) => (
                            <> on {formatDate(startDate(), timeZone())}</>
                          )}
                        </Show>
                      </span>
                    </span>
                  )}
                </Show>
              )}
            </Show>
          </div>
        </Show>
      </div>

      <MatchSummarySide
        lookup={lookup}
        side="SIDE_2"
        mode={props.mode}
        stats={props.stats}
        prediction={prediction()}
        winProbability={winProbability()}
        preview={props.preview}
      />
    </div>
  );
};

export const MatchSummaryModal: Component<MatchSummaryModalProps> = (props) => {
  const [, { open }] = useModal();
  const activeMatches = useActiveMatches();
  const owner = getOwner();

  const timeline = createResilientAsync(
    () => props.matchUuid,
    queryMatchTimeline,
  );

  const active = () =>
    activeMatches().find((entry) => entry.match.uuid === props.matchUuid) ??
    null;

  const source = createMemo((): MatchTimeline | null => {
    const current = timeline.latest;
    const pushed = active();

    if (!current) return null;
    if (pushed === null) return current;

    return { ...current, match: pushed.match, events: pushed.events };
  });

  const mode = () => {
    const current = source();

    return current === null ? null : MatchSummaryModes[current.match.status];
  };

  const stats = createResilientAsync(
    () =>
      mode() === MatchSummaryModeEnum.FINAL
        ? { type: 'MATCH' as const, key: props.matchUuid }
        : ResilientSkip,
    queryPeriodStats,
  );

  const preview = createResilientAsync(() => {
    const current = source();

    if (current === null || mode() !== MatchSummaryModeEnum.PREVIEW) {
      return ResilientSkip;
    }

    return getSortedLineup(current.match);
  }, queryMatchPreview);

  const openTimeline = () => {
    open({
      props: { component: MatchTimelineModal, matchUuid: props.matchUuid },
      owner,
    });
  };

  createEffect(
    on(
      () => active() === null,
      (isInactive) => {
        if (isInactive) revalidate(queryMatchTimeline.keyFor(props.matchUuid));
      },
      { defer: true },
    ),
  );

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Match Summary"
      bottomLeftLabels={
        <Show when={(source()?.events.length ?? 0) > 0}>
          <Button severity="secondary" onClick={openTimeline}>
            Timeline
          </Button>
        </Show>
      }
    >
      <Show
        when={source()}
        fallback={
          <div class={style.loading}>
            <Spinner />
          </div>
        }
      >
        {(current) => (
          <MatchSummary
            timeline={current()}
            active={
              active() ?? {
                match: current().match,
                events: current().events,
                updatedAt: new Date(),
              }
            }
            mode={mode() ?? MatchSummaryModeEnum.FINAL}
            stats={stats.latest ?? null}
            preview={preview.latest ?? null}
          />
        )}
      </Show>
    </Modal>
  );
};

export function useMatchSummaryModal(): (matchUuid: string) => void {
  const [, { open }] = useModal();
  const owner = getOwner();

  return (matchUuid) => {
    open({
      props: { component: MatchSummaryModal, matchUuid },
      owner,
    });
  };
}
