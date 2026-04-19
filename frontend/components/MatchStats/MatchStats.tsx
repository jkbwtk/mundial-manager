import {
  createEffect,
  createSignal,
  type JSX,
  on,
  type Setter,
  Show,
} from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { Button } from '#components/Button';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import {
  StatPaginatorWidget,
  useStatPaginatedFrame,
  useStatPaginator,
} from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import { getTeamColorClass } from '#flib/teamColors';
import { useModal } from '#providers/ModalProvider';
import { hasBeenCancelled, hasWon } from '#shared/matchUtils';
import { formatDate, formatDuration } from '#shared/timeUtils';
import style from './MatchStats.module.scss';

export interface MatchStatsBaseProps {
  setButton?: Setter<JSX.Element>;
}

export const MatchStatsBase: Component<MatchStatsBaseProps> = (props) => {
  const [, { open }] = useModal();
  const [state] = useStatPaginator();
  const stats = useStatPaginatedFrame();
  const match = () => stats().match;

  const openTimeline = () => {
    open({
      props: {
        component: MatchTimelineModal,
        page: state.currentPage,
      },
    });
  };

  createEffect(
    on([() => match(), () => props.setButton], ([match, setButton]) => {
      if (setButton) {
        setButton(
          <Show when={match.replayMetadata}>
            <Button severity="secondary" onPointerUp={openTimeline}>
              Timeline
            </Button>
          </Show>,
        );
      }
    }),
  );

  return (
    <>
      <div class={style.container}>
        <span>Match:</span>
        <strong>{stats().matchStats.label}</strong>

        <span>Team 1:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: hasWon(match(), 'team1'),
            }}
          >
            {match().team1}
          </AnimatedText>
        </strong>

        <span>Team 2:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: hasWon(match(), 'team2'),
            }}
          >
            {match().team2}
          </AnimatedText>
        </strong>

        <span>Score:</span>
        <strong>
          <span
            classList={{
              [style.highlight]: hasWon(match(), 'team1'),
            }}
          >
            {match().score1}
          </span>
          :
          <span
            classList={{
              [style.highlight]: hasWon(match(), 'team2'),
            }}
          >
            {match().score2}
          </span>
        </strong>

        <Show when={match().duration}>
          <span>Duration:</span>
          <strong>
            <AnimatedText>{formatDuration(match().duration!)}</AnimatedText>
          </strong>
        </Show>

        <Show when={match().pauseDuration > 0}>
          <span>Pause Duration:</span>
          <strong>
            <AnimatedText>{formatDuration(match().pauseDuration)}</AnimatedText>
          </strong>
        </Show>

        <Show when={match().date}>
          <span>Date:</span>
          <strong>
            <AnimatedText>{formatDate(match().date!)}</AnimatedText>
          </strong>
        </Show>

        <Show when={match().floor}>
          <span>Floor:</span>
          <strong>
            <AnimatedText>{match().floor}</AnimatedText>
          </strong>
        </Show>

        <span>Season:</span>
        <strong>
          <AnimatedText>{stats().season.label}</AnimatedText>
        </strong>

        <span>Winning Color:</span>
        <Show
          when={hasBeenCancelled(match().replayMetadata?.events) === false}
          fallback={<strong class={style.cancelledLabel}>CANCELLED</strong>}
        >
          <span
            classList={{
              [getTeamColorClass(match().winningColor)]: true,
              [style.teamColor]: true,
            }}
          />
        </Show>
      </div>

      <Show when={stats().matchStats.goalsPerMinute !== null}>
        <Divider />
        <div class={style.container}>
          <span>Goals Per Minute:</span>
          <strong>
            <AnimatedText>
              {stats().matchStats.goalsPerMinute!.toFixed(2)}
            </AnimatedText>
          </strong>

          <Show when={stats().matchStats.averageTimeBetweenGoals !== null}>
            <span>Avg. Time Between Goals:</span>
            <strong>
              <AnimatedText>
                {stats().matchStats.averageTimeBetweenGoalsFormatted}
              </AnimatedText>
            </strong>
          </Show>

          <Show when={stats().matchStats.longestTimeBetweenGoals !== null}>
            <span>Longest Time Between Goals:</span>
            <strong>
              <AnimatedText>
                {stats().matchStats.longestTimeBetweenGoalsFormatted}
              </AnimatedText>
            </strong>
          </Show>

          <Show when={stats().matchStats.shortestTimeBetweenGoals !== null}>
            <span>Shortest Time Between Goals:</span>
            <strong>
              <AnimatedText>
                {stats().matchStats.shortestTimeBetweenGoalsFormatted}
              </AnimatedText>
            </strong>
          </Show>
        </div>
      </Show>

      <Show
        when={
          stats().matchStats.ballOutCount !== null ||
          stats().matchStats.positionChangeCount !== null ||
          stats().matchStats.ownGoalCount !== null
        }
      >
        <Divider />
        <div class={style.container}>
          <Show when={stats().matchStats.ballOutCount !== null}>
            <span>Ball Outs:</span>
            <strong>
              <AnimatedText>{stats().matchStats.ballOutCount}</AnimatedText>
            </strong>
          </Show>

          <Show when={stats().matchStats.positionChangeCount !== null}>
            <span>Position Changes:</span>
            <strong>
              <AnimatedText>
                {stats().matchStats.positionChangeCount}
              </AnimatedText>
            </strong>
          </Show>

          <Show when={stats().matchStats.ownGoalCount !== null}>
            <span>Own Goals:</span>
            <strong>
              <AnimatedText>{stats().matchStats.ownGoalCount}</AnimatedText>
            </strong>
          </Show>
        </div>
      </Show>
    </>
  );
};

export const MatchStats: Component = () => {
  const [button, setPage] = createSignal<JSX.Element>(null);

  return (
    <StatPaginatorWidget
      statType="match"
      class={style.widget}
      topLeftLabels={'Match Stats'}
      bottomLeftLabels={[button()]}
    >
      <MatchStatsBase setButton={setPage} />
    </StatPaginatorWidget>
  );
};
