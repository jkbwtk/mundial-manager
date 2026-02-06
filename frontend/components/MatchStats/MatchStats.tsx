import { createEffect, createSignal, type Setter, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { Button } from '#components/Button';
import {
  MatchPaginatorWidget,
  usePaginatedFrame,
} from '#components/MatchPaginatorWidget';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { Divider } from '#components/Widget';
import { defaultMatch } from '#flib/defaultStats';
import { formatDate, formatDuration } from '#flib/sheetUtils';
import { getTeamColorClass } from '#flib/teamColors';
import { useModal } from '#providers/ModalProvider';
import type { Match } from '#shared/types/Sheets';
import style from './MatchStats.module.scss';

export interface MatchStatsBaseProps {
  setMatch?: Setter<Match>;
}

export const MatchStatsBase: Component<MatchStatsBaseProps> = (props) => {
  const stats = usePaginatedFrame();
  const match = () => stats().match;

  createEffect(() => {
    const m = match();

    if (props.setMatch) {
      props.setMatch(m);
    }
  });

  return (
    <>
      <div class={style.container}>
        <span>Match:</span>
        <strong>{stats().matchStats.label}</strong>

        <span>Team 1:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: match().score1 > match().score2,
            }}
          >
            {match().team1}
          </AnimatedText>
        </strong>

        <span>Team 2:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: match().score1 < match().score2,
            }}
          >
            {match().team2}
          </AnimatedText>
        </strong>

        <span>Score:</span>
        <strong>
          <span
            classList={{
              [style.highlight]: match().score1 > match().score2,
            }}
          >
            {match().score1}
          </span>
          :
          <span
            classList={{
              [style.highlight]: match().score1 < match().score2,
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

        <span>Winning Color:</span>
        <span
          classList={{
            [getTeamColorClass(match().winningColor)]: true,
            [style.teamColor]: true,
          }}
        />
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
        </div>
      </Show>
    </>
  );
};

export const MatchStats: Component = () => {
  const [match, setMatch] = createSignal<Match>(defaultMatch);
  const [, { open }] = useModal();

  const openTimeline = () => {
    open({
      props: {
        component: MatchTimelineModal,
        match: match(),
      },
    });
  };

  return (
    <MatchPaginatorWidget
      class={style.widget}
      topLeftLabels={'Match Stats'}
      bottomLeftLabels={[
        <Show when={match().replayMetadata}>
          <Button severity="secondary" onPointerUp={openTimeline}>
            Timeline
          </Button>
        </Show>,
      ]}
    >
      <MatchStatsBase setMatch={setMatch} />
    </MatchPaginatorWidget>
  );
};
