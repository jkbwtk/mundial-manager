import {
  createEffect,
  createMemo,
  createSignal,
  For,
  getOwner,
  on,
  Show,
} from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { BallLabel } from '#components/BallLabel';
import { Button } from '#components/Button';
import { ColorBlock } from '#components/ColorBlock';
import { InlineAction } from '#components/InlineAction';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { Skeleton } from '#components/Skeleton';
import { TableLabel } from '#components/TableLabel';
import { Divider, Widget } from '#components/Widget';
import { useSeasonLookup } from '#flib/entityLookup';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import {
  createMatchTimelineLookup,
  type MatchTimelineLookup,
} from '#flib/matchTimelineLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { getPeriodMatchQuery } from '#flib/statsPeriod';
import { queryPeriodMatch } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useStatsPeriod } from '#providers/StatsPeriodProvider';
import {
  formatKnownStartDatetime,
  getKnownStartDate,
} from '#shared/matchLabels';
import {
  getMatchTimelineStats,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import { formatDuration } from '#shared/timeUtils';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';
import style from './MatchStats.module.scss';

interface MatchStatsDetailsProps {
  timeline: MatchTimeline;
}

interface MatchSideRowProps {
  lookup: MatchTimelineLookup;
  side: MatchSide;
  winner: boolean;
}

const MatchSideRow: Component<MatchSideRowProps> = (props) => (
  <strong classList={{ [style.highlight]: props.winner }}>
    <ColorBlock color={props.lookup.getSideColor(props.side)} width={2} />{' '}
    <AnimatedText>
      {props.lookup
        .getSortedSidePlayers(props.side)
        .map(props.lookup.getPlayerName)
        .join(' ')}
    </AnimatedText>
  </strong>
);

const MatchStatsDetails: Component<MatchStatsDetailsProps> = (props) => {
  const seasons = useSeasonLookup();
  const timeZone = useLeagueTimeZone();
  const lookup = createMatchTimelineLookup(() => props.timeline);

  const match = () => props.timeline.match;
  const winner = () => getMatchWinningSide(match());
  const stats = createMemo(() =>
    getMatchTimelineStats(props.timeline.events, match().duration ?? null),
  );

  const balls = createMemo(() => {
    const usedUuids = new Set([
      match().ballUuid,
      ...props.timeline.events.flatMap((event) =>
        event.type === 'BALL_CHANGE' ? [event.ball] : [],
      ),
    ]);

    return [...usedUuids].flatMap(
      (uuid) => props.timeline.balls.find((ball) => ball.uuid === uuid) ?? [],
    );
  });

  const season = () => {
    const startDate = getKnownStartDate(match());

    return (
      seasons
        .all()
        .find(
          (season) =>
            startDate !== null &&
            startDate >= season.startDate &&
            startDate <= season.endDate,
        ) ?? null
    );
  };

  return (
    <>
      <div class={style.container}>
        <span>Date:</span>
        <strong>
          <AnimatedText>
            {formatKnownStartDatetime(match(), timeZone())}
          </AnimatedText>
        </strong>

        <span>Side 1:</span>
        <MatchSideRow
          lookup={lookup}
          side="SIDE_1"
          winner={winner() === 'SIDE_1'}
        />

        <span>Side 2:</span>
        <MatchSideRow
          lookup={lookup}
          side="SIDE_2"
          winner={winner() === 'SIDE_2'}
        />

        <span>Score:</span>
        <strong>
          <span classList={{ [style.highlight]: winner() === 'SIDE_1' }}>
            {match().side1Score}
          </span>
          :
          <span classList={{ [style.highlight]: winner() === 'SIDE_2' }}>
            {match().side2Score}
          </span>
        </strong>

        <span>Winning Color:</span>
        <Show
          when={match().status !== 'CANCELED'}
          fallback={<strong class={style.cancelledLabel}>Cancelled</strong>}
        >
          <Show when={winner()} fallback={<strong>Draw</strong>}>
            {(side) => <ColorBlock color={lookup.getSideColor(side())} />}
          </Show>
        </Show>

        <Show when={match().duration}>
          {(duration) => (
            <>
              <span>Duration:</span>
              <strong>
                <AnimatedText>{formatDuration(duration())}</AnimatedText>
              </strong>
            </>
          )}
        </Show>

        <Show when={match().pauseDuration > 0}>
          <span>Pause Duration:</span>
          <strong>
            <AnimatedText>{formatDuration(match().pauseDuration)}</AnimatedText>
          </strong>
        </Show>

        <Show when={props.timeline.table}>
          {(table) => (
            <>
              <span>Table:</span>
              <strong>
                <TableLabel table={table()} />
              </strong>
            </>
          )}
        </Show>

        <Show when={balls().length > 0}>
          <span class={style.listLabel}>
            {balls().length > 1 ? 'Balls:' : 'Ball:'}
          </span>
          <strong>
            <For each={balls()}>
              {(ball) => (
                <div>
                  <BallLabel ball={ball} />
                </div>
              )}
            </For>
          </strong>
        </Show>

        <Show when={season()}>
          {(season) => (
            <>
              <span>Season:</span>
              <strong>{season().name}</strong>
            </>
          )}
        </Show>
      </div>

      <Show when={props.timeline.events.length > 0}>
        <Divider />
        <div class={style.container}>
          <span>Goals Per Minute:</span>
          <strong>
            <AnimatedText>
              {stats().goalsPerMinute?.toFixed(2) ?? '-'}
            </AnimatedText>
          </strong>

          <span>Avg. Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDuration(stats().averageTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Longest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDuration(stats().longestTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Shortest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDuration(stats().shortestTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Ball Outs:</span>
          <strong>
            <AnimatedText>{stats().counts.BALL_OUT ?? 0}</AnimatedText>
          </strong>

          <span>Position Changes:</span>
          <strong>
            <AnimatedText>{stats().counts.POSITION_CHANGE ?? 0}</AnimatedText>
          </strong>

          <span>Own Goals:</span>
          <strong>
            <AnimatedText>{stats().ownGoals}</AnimatedText>
          </strong>

          <span>Lead Changes:</span>
          <strong>
            <AnimatedText>{stats().leadChanges}</AnimatedText>
          </strong>
        </div>
      </Show>
    </>
  );
};

export const MatchStats: Component = () => {
  const [, { open }] = useModal();
  const [period] = useStatsPeriod();
  const owner = getOwner();

  const [offset, setOffset] = createSignal(0);

  const match = createResilientAsync(
    () => getPeriodMatchQuery(period.period, offset()),
    queryPeriodMatch,
  );

  const total = () => match.latest?.total ?? 0;

  const recordedMatchUuid = () => {
    const timeline = match.latest?.timeline;

    return timeline && timeline.events.length > 0 ? timeline.match.uuid : null;
  };

  const openTimeline = (matchUuid: string) => {
    open({
      props: { component: MatchTimelineModal, matchUuid },
      owner,
    });
  };

  createEffect(
    on(
      () => period.period,
      () => setOffset(0),
      { defer: true },
    ),
  );

  return (
    <Widget
      class={style.widget}
      topLeftLabels="Match Stats"
      pending={match.pending()}
      bottomLeftLabels={
        <Show when={recordedMatchUuid()}>
          {(matchUuid) => (
            <Button
              severity="secondary"
              onClick={() => openTimeline(matchUuid())}
            >
              Timeline
            </Button>
          )}
        </Show>
      }
      bottomRightLabels={
        <Show when={total() > 1}>
          <span>
            <InlineAction
              content="<"
              symbol=","
              onAction={() =>
                setOffset((value) => Math.min(value + 1, total() - 1))
              }
            />{' '}
            {total() - offset()}/{total()}{' '}
            <InlineAction
              content=">"
              symbol="."
              onAction={() => setOffset((value) => Math.max(value - 1, 0))}
            />
          </span>
        </Show>
      }
    >
      <Show
        when={match.latest !== undefined}
        fallback={<Skeleton lines={12} />}
      >
        <Show
          when={match.latest}
          fallback={<span class={style.noData}>No matches</span>}
        >
          {(current) => <MatchStatsDetails timeline={current().timeline} />}
        </Show>
      </Show>
    </Widget>
  );
};
